'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { invalidateUserPermissions } from '@/lib/permissions/user-permissions'
import type { ActionResult, Profile, UserRole, UserPrivilegeOverride } from '@/types/app.types'
import type { Permission } from '@/lib/permissions/permissions'

// ============================================================
// LIST USERS
// ============================================================
export async function getUsers(): Promise<ActionResult<Profile[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || !['super_admin', 'admin'].includes(me.role)) {
    return { success: false, error: 'Forbidden' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  if (error) return { success: false, error: 'Failed to fetch users' }
  return { success: true, data: (data ?? []) as Profile[] }
}

// ============================================================
// GET SINGLE USER + OVERRIDES
// ============================================================
export async function getUserWithOverrides(userId: string): Promise<ActionResult<{
  profile: Profile
  overrides: UserPrivilegeOverride[]
}>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || !['super_admin', 'admin'].includes(me.role)) {
    return { success: false, error: 'Forbidden' }
  }

  const [profileRes, overridesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('user_privilege_overrides').select('*').eq('user_id', userId),
  ])

  if (!profileRes.data) return { success: false, error: 'User not found' }

  return {
    success: true,
    data: {
      profile: profileRes.data as Profile,
      overrides: (overridesRes.data ?? []) as UserPrivilegeOverride[],
    },
  }
}

// ============================================================
// CREATE USER
// ============================================================
export async function createUser(formData: FormData): Promise<ActionResult<Profile>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || !['super_admin', 'admin'].includes(me.role)) {
    return { success: false, error: 'Forbidden' }
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string)?.trim()
  const role = formData.get('role') as UserRole
  const phone = (formData.get('phone') as string)?.trim() || null

  if (!email || !password || !fullName || !role) {
    return { success: false, error: 'Email, password, name, and role are required' }
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  // Only super_admin can create other super_admins
  if (role === 'super_admin' && me.role !== 'super_admin') {
    return { success: false, error: 'Only super admins can create super admin accounts' }
  }

  const adminClient = createAdminClient()

  // Create the auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? 'Failed to create auth user' }
  }

  /*
   * Upsert rather than insert: many Supabase projects have a
   * `handle_new_user` trigger that inserts a skeleton profile row the
   * moment the auth user is created. If that trigger fires first, a plain
   * INSERT would fail with a unique-key violation. Upserting on `id`
   * handles both cases — trigger-created row updated, or fresh row inserted.
   */
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .upsert(
      {
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        phone,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (profileError || !profile) {
    // Roll back: delete the auth user we just created
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: profileError?.message ?? 'Failed to create user profile' }
  }

  revalidatePath('/settings/users')
  return { success: true, data: profile as Profile }
}

// ============================================================
// UPDATE USER
// ============================================================
export async function updateUser(
  userId: string,
  updates: { role?: UserRole; full_name?: string; phone?: string; is_active?: boolean }
): Promise<ActionResult<Profile>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || !['super_admin', 'admin'].includes(me.role)) {
    return { success: false, error: 'Forbidden' }
  }

  if (updates.role === 'super_admin' && me.role !== 'super_admin') {
    return { success: false, error: 'Only super admins can assign the super_admin role' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error || !data) return { success: false, error: 'Failed to update user' }

  // Invalidate permission cache for this user — their role may have changed
  invalidateUserPermissions(userId)

  revalidatePath('/settings/users')
  revalidatePath(`/settings/users/${userId}`)
  return { success: true, data: data as Profile }
}

// ============================================================
// SET PRIVILEGE OVERRIDE
// ============================================================
export async function setPrivilegeOverride(
  userId: string,
  permission: Permission,
  granted: boolean | null // null = remove override (revert to role default)
): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || !['super_admin', 'admin'].includes(me.role)) {
    return { success: false, error: 'Forbidden' }
  }

  if (granted === null) {
    // Remove override → revert to role default
    await supabase
      .from('user_privilege_overrides')
      .delete()
      .eq('user_id', userId)
      .eq('permission', permission)
  } else {
    // Upsert override
    await supabase
      .from('user_privilege_overrides')
      .upsert(
        { user_id: userId, permission, granted, granted_by: user.id, created_at: new Date().toISOString() },
        { onConflict: 'user_id,permission' }
      )
  }

  // Bust the per-user permission cache immediately
  invalidateUserPermissions(userId)

  revalidatePath(`/settings/users/${userId}`)
  return { success: true, data: undefined }
}
