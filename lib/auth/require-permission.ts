import { redirect } from 'next/navigation'
import { requireUser, type ServerUser } from './server-session'
import { getUserPermissions } from '@/lib/permissions/user-permissions'
import type { Permission } from '@/lib/permissions/permissions'

/*
 * Page-level permission gate — the authoritative enforcement layer.
 *
 * Middleware only checks role-default permissions (fast, cookie-cached).
 * Per-user privilege overrides are enforced here, where getUserPermissions()
 * uses a properly tag-invalidated Next.js cache.
 *
 * Call at the top of any server component that needs permission enforcement:
 *   const user = await requirePermission('orders.read.all')
 */
export async function requirePermission(permission: Permission): Promise<ServerUser> {
  const user = await requireUser()
  const perms = await getUserPermissions(user.id, user.role)
  if (!perms.includes(permission)) redirect('/dashboard')
  return user
}

/*
 * Same as requirePermission but accepts multiple permissions —
 * access is granted if the user holds ANY ONE of them.
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<ServerUser> {
  const user = await requireUser()
  const perms = await getUserPermissions(user.id, user.role)
  if (!permissions.some(p => perms.includes(p))) redirect('/dashboard')
  return user
}
