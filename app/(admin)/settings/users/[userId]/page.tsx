import { requirePermission } from '@/lib/auth/require-permission'
import { getUserWithOverrides } from '@/actions/users'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getPermissions, PERMISSION_LABELS, PERMISSION_GROUPS } from '@/lib/permissions/permissions'
import { ROLE_LABELS } from '@/lib/permissions/roles'
import { UserEditForm } from '@/components/users/UserEditForm'
import { PrivilegeToggle } from '@/components/users/PrivilegeToggle'
import type { UserRole } from '@/types/app.types'
import type { Permission } from '@/lib/permissions/permissions'

const ROLE_BADGE: Record<UserRole, { bg: string; color: string }> = {
  super_admin:     { bg: '#EEEDFE', color: '#3C3489' },
  admin:           { bg: '#E6F1FB', color: '#0C447C' },
  support_staff:   { bg: '#F7F5EE', color: '#5F5E5A' },
  tailor_master:   { bg: '#FAEEDA', color: '#633806' },
  tailor:          { bg: '#E1F5EE', color: '#085041' },
  embroidery_staff:{ bg: '#F5EEF8', color: '#6A3B7C' },
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const admin = await requirePermission('users.manage')
  const { userId } = await params

  const result = await getUserWithOverrides(userId)
  if (!result.success) notFound()

  const { profile, overrides } = result.data

  const roleDefaults = new Set(getPermissions(profile.role))
  const overrideMap = new Map(overrides.map(o => [o.permission, o.granted]))

  const badge = ROLE_BADGE[profile.role] ?? ROLE_BADGE.support_staff
  const isSelf = admin.id === userId
  const canEditRole = admin.role === 'super_admin' || (admin.role === 'admin' && profile.role !== 'super_admin')

  return (
    <div className="max-w-2xl" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back */}
      <div>
        <Link href="/settings/users" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888780', textDecoration: 'none', marginBottom: 12 }}>
          <ChevronLeft style={{ width: 14, height: 14 }} /> Back to Users
        </Link>

        {/* User card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F1EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#5F5E5A', flexShrink: 0 }}>
            {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f2416', letterSpacing: '-0.5px' }}>{profile.full_name}</h1>
              <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 99, background: badge.bg, color: badge.color }}>
                {ROLE_LABELS[profile.role]}
              </span>
              {isSelf && <span style={{ fontSize: 10, color: '#888780' }}>(you)</span>}
            </div>
            <p style={{ fontSize: 13, color: '#888780', marginTop: 2 }}>{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <section>
        <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888780', marginBottom: 10 }}>
          Profile
        </p>
        <UserEditForm profile={profile} canEditRole={canEditRole} adminRole={admin.role} />
      </section>

      {/* Privilege editor */}
      <section>
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888780' }}>
            Permissions
          </p>
          <p style={{ fontSize: 12, color: '#888780', marginTop: 3 }}>
            Defaults come from the <strong style={{ color: '#2C2C2A' }}>{ROLE_LABELS[profile.role]}</strong> role.
            Toggle individual permissions to override for this user only.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PERMISSION_GROUPS.map(group => (
            <div key={group.label} style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: '#F7F5EE', borderBottom: '0.5px solid #F1EFE8' }}>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888780' }}>
                  {group.label}
                </p>
              </div>
              {group.permissions.map((perm, i, arr) => {
                const roleHas = roleDefaults.has(perm)
                const overrideVal = overrideMap.get(perm) // undefined = no override
                const effective = overrideVal !== undefined ? overrideVal : roleHas

                return (
                  <div
                    key={perm}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '0.5px solid #F1EFE8' : 'none', gap: 12 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: '#2C2C2A', fontWeight: effective ? 500 : 400 }}>
                        {PERMISSION_LABELS[perm]}
                      </p>
                      <p style={{ fontSize: 10, color: '#B4B2A9', marginTop: 1 }}>
                        {overrideVal !== undefined
                          ? overrideVal
                            ? 'Explicitly granted (override)'
                            : 'Explicitly revoked (override)'
                          : roleHas
                            ? 'Granted by role'
                            : 'Not in role default'}
                      </p>
                    </div>
                    <PrivilegeToggle
                      userId={userId}
                      permission={perm as Permission}
                      effective={effective}
                      isOverridden={overrideVal !== undefined}
                      roleDefault={roleHas}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
