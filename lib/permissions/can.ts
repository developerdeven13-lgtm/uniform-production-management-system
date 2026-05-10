import type { UserRole } from '@/types/app.types'
import type { Permission } from './permissions'
import { getPermissions } from './permissions'

export function can(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return getPermissions(role).includes(permission)
}

export function canAny(role: UserRole | undefined | null, permissions: Permission[]): boolean {
  if (!role) return false
  const rolePerms = getPermissions(role)
  return permissions.some(p => rolePerms.includes(p))
}

export function canAll(role: UserRole | undefined | null, permissions: Permission[]): boolean {
  if (!role) return false
  const rolePerms = getPermissions(role)
  return permissions.every(p => rolePerms.includes(p))
}
