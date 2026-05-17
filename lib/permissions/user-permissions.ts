import { unstable_cache, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPermissions, type Permission } from './permissions'
import type { UserRole } from '@/types/app.types'

export function userPermsCacheTag(userId: string) {
  return `user-perms-${userId}`
}

/*
 * Returns the effective permission set for a user: role defaults merged with
 * any per-user overrides stored in user_privilege_overrides.
 *
 * Uses unstable_cache with a per-user tag so:
 *  • Served from Next.js cache on every request after the first (no DB hit)
 *  • Invalidated immediately when an admin changes privileges via invalidateUserPermissions()
 *  • TTL is 60 s as a safety net for stale cache
 *
 * The admin client is used so this can run inside unstable_cache
 * (which has no access to request-scoped cookies).
 */
export function getUserPermissions(userId: string, role: UserRole): Promise<Set<Permission>> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data: overrides } = await supabase
        .from('user_privilege_overrides')
        .select('permission, granted')
        .eq('user_id', userId)

      const perms = new Set(getPermissions(role))

      for (const o of overrides ?? []) {
        if (o.granted) {
          perms.add(o.permission as Permission)
        } else {
          perms.delete(o.permission as Permission)
        }
      }

      return perms
    },
    [userPermsCacheTag(userId)],
    { revalidate: 60, tags: [userPermsCacheTag(userId)] }
  )()
}

export async function userCan(
  userId: string,
  role: UserRole,
  permission: Permission
): Promise<boolean> {
  const perms = await getUserPermissions(userId, role)
  return perms.has(permission)
}

export function invalidateUserPermissions(userId: string) {
  revalidateTag(userPermsCacheTag(userId))
}
