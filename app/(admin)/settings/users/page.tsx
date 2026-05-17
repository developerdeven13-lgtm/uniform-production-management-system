import { requireUser } from '@/lib/auth/server-session'
import { getUsers } from '@/actions/users'
import Link from 'next/link'
import { Plus, UserCircle2, ShieldCheck } from 'lucide-react'
import { PageTitle } from '@/components/shared/PageTitle'
import { ROLE_LABELS } from '@/lib/permissions/roles'
import type { UserRole } from '@/types/app.types'

const ROLE_BADGE: Record<UserRole, { bg: string; color: string }> = {
  super_admin:     { bg: '#EEEDFE', color: '#3C3489' },
  admin:           { bg: '#E6F1FB', color: '#0C447C' },
  support_staff:   { bg: '#F7F5EE', color: '#5F5E5A' },
  tailor_master:   { bg: '#FAEEDA', color: '#633806' },
  tailor:          { bg: '#E1F5EE', color: '#085041' },
  embroidery_staff:{ bg: '#F5EEF8', color: '#6A3B7C' },
}

export default async function UsersPage() {
  await requireUser()
  const result = await getUsers()
  const users = result.success ? result.data : []
  const total = users.length

  return (
    <div className="space-y-5 max-w-7xl">
      <PageTitle
        count={total}
        label="Total"
        title="Staff"
        action={
          <Link
            href="/settings/users/new"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f2416', color: '#fff', borderRadius: 9, fontWeight: 500, textDecoration: 'none' }}
            className="text-[12px] px-2 py-2 lg:px-4 lg:py-2 2xl:text-[16px] 2xl:px-5 2xl:py-2.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add User
          </Link>
        }
      />

      <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
        {users.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <UserCircle2 style={{ width: 36, height: 36, color: '#D3D1C7', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>No staff accounts yet</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 24, padding: '10px 18px', background: '#F7F5EE', borderBottom: '0.5px solid #F1EFE8' }}>
              {['Name', 'Role', 'Email', 'Status', ''].map((h, i) => (
                <div key={i} style={{ flex: i === 0 ? 2 : i < 4 ? 1 : 0, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888780' }} className="text-[9px] 2xl:text-[12px]">
                  {h}
                </div>
              ))}
            </div>

            {users.map((u, idx) => {
              const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.support_staff
              return (
                <div
                  key={u.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '13px 18px', borderBottom: idx < users.length - 1 ? '0.5px solid #F1EFE8' : 'none' }}
                >
                  <div style={{ flex: 2, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#5F5E5A', flexShrink: 0 }}>
                        {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A' }} className="2xl:text-[16px]">{u.full_name}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 99, background: badge.bg, color: badge.color }} className="2xl:text-[12px]">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: '#5F5E5A' }} className="2xl:text-[14px]">{u.email}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 99, background: u.is_active ? '#E1F5EE' : '#F1EFE8', color: u.is_active ? '#085041' : '#888780' }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <Link
                    href={`/settings/users/${u.id}`}
                    style={{ fontSize: 12, fontWeight: 500, color: '#0f2416', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    className="2xl:text-[14px]"
                  >
                    Manage →
                  </Link>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
