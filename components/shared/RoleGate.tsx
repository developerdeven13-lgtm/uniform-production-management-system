'use client'

import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { Permission } from '@/lib/permissions/permissions'
import { can, canAny } from '@/lib/permissions/can'

interface RoleGateProps {
  permission?: Permission
  anyOf?: Permission[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RoleGate({ permission, anyOf, fallback = null, children }: RoleGateProps) {
  const { profile } = useCurrentUser()
  const role = profile?.role

  const allowed = permission
    ? can(role, permission)
    : anyOf
      ? canAny(role, anyOf)
      : true

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
