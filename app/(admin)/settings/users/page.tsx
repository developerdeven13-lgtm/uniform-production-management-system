import { requireUser } from '@/lib/auth/server-session'
import { getUsers } from '@/actions/users'
import Link from 'next/link'
import { Plus, UserCircle2 } from 'lucide-react'
import { PageTitle } from '@/components/shared/PageTitle'
import { ROLE_LABELS } from '@/lib/permissions/roles'
import type { UserRole } from '@/types/app.types'

const ROLE_BADGE: Record<UserRole, { bg: string; color: string }> = {
  super_admin:      { bg: '#EEEDFE', color: '#3C3489' },
  admin:            { bg: '#E6F1FB', color: '#0C447C' },
  support_staff:    { bg: '#F7F5EE', color: '#5F5E5A' },
  tailor_master:    { bg: '#FAEEDA', color: '#633806' },
  tailor:           { bg: '#E1F5EE', color: '#085041' },
  embroidery_staff: { bg: '#F5EEF8', color: '#6A3B7C' },
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
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#0f2416', color: '#fff', borderRadius: 9,
              fontWeight: 500, textDecoration: 'none',
            }}
            className="text-[12px] px-2 py-2 lg:px-4 lg:py-2 2xl:text-[16px] 2xl:px-5 2xl:py-2.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add User
          </Link>
        }
      />

      {/* Card wrapper — overflow:hidden keeps rounded corners */}
      <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
        {users.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <UserCircle2 style={{ width: 36, height: 36, color: '#D3D1C7', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>No staff accounts yet</p>
            <Link
              href="/settings/users/new"
              style={{ display: 'inline-block', marginTop: 12, fontSize: 12, fontWeight: 500, color: '#0f2416', textDecoration: 'none' }}
            >
              + Add first user
            </Link>
          </div>
        ) : (
          /* Scrollable inner container — min-width forces horizontal scroll on small screens */
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <div style={{ minWidth: 580 }}>

              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 2fr 1fr auto',
                gap: 12,
                padding: '10px 18px',
                background: '#F7F5EE',
                borderBottom: '0.5px solid #F1EFE8',
              }}>
                {['Name', 'Role', 'Email', 'Status', ''].map(h => (
                  <div key={h} style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888780' }} className="text-[9px] 2xl:text-[12px]">
                    {h}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {users.map((u, idx) => {
                const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.support_staff
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 2fr 1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: '13px 18px',
                      borderBottom: idx < users.length - 1 ? '0.5px solid #F1EFE8' : 'none',
                      transition: 'background 0.1s',
                    }}
                    className="hover:bg-[#F7F5EE]"
                  >
                    {/* Name + avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: '#F1EFE8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#5F5E5A', flexShrink: 0,
                      }}>
                        {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="2xl:text-[15px]">
                          {u.full_name}
                        </p>
                        {u.phone && (
                          <p style={{ fontSize: 11, color: '#888780', marginTop: 1 }}>{u.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Role badge */}
                    <div>
                      <span style={{
                        fontSize: 10, fontWeight: 500, padding: '3px 8px',
                        borderRadius: 99, background: badge.bg, color: badge.color,
                        whiteSpace: 'nowrap',
                      }} className="2xl:text-[12px]">
                        {ROLE_LABELS[u.role]}
                      </span>
                    </div>

                    {/* Email */}
                    <div style={{ fontSize: 12, color: '#5F5E5A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="2xl:text-[14px]">
                      {u.email}
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        fontSize: 10, fontWeight: 500, padding: '3px 8px',
                        borderRadius: 99,
                        background: u.is_active ? '#E1F5EE' : '#F1EFE8',
                        color: u.is_active ? '#085041' : '#888780',
                        whiteSpace: 'nowrap',
                      }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Manage link */}
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
