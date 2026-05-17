'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateUser } from '@/actions/users'
import type { Profile, UserRole } from '@/types/app.types'
import { ROLE_LABELS } from '@/lib/permissions/roles'

const ALL_ROLES: UserRole[] = ['super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor', 'embroidery_staff']

interface Props {
  profile: Profile
  canEditRole: boolean
  adminRole: UserRole
}

export function UserEditForm({ profile, canEditRole, adminRole }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<UserRole>(profile.role)
  const [isActive, setIsActive] = useState(profile.is_active)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateUser(profile.id, {
        full_name: (fd.get('full_name') as string).trim(),
        phone: (fd.get('phone') as string)?.trim() || undefined,
        role,
        is_active: isActive,
      })
      if (result.success) {
        toast.success('User updated')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const availableRoles = adminRole === 'super_admin' ? ALL_ROLES : ALL_ROLES.filter(r => r !== 'super_admin')

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { name: 'full_name', label: 'Full Name', type: 'text', defaultValue: profile.full_name },
          { name: 'phone',     label: 'Phone',     type: 'tel',  defaultValue: profile.phone ?? '' },
        ].map((field, i) => (
          <div key={field.name} style={{ padding: '12px 16px', borderBottom: '0.5px solid #F1EFE8' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', marginBottom: 4 }}>{field.label}</label>
            <input
              name={field.name}
              type={field.type}
              defaultValue={field.defaultValue}
              style={{ width: '100%', padding: 0, fontSize: 13, color: '#2C2C2A', background: 'none', border: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        ))}

        {/* Role */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F1EFE8' }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', marginBottom: 4 }}>Role</label>
          {canEditRole ? (
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              style={{ width: '100%', padding: 0, fontSize: 13, color: '#2C2C2A', background: 'none', border: 'none', outline: 'none', cursor: 'pointer' }}
            >
              {availableRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          ) : (
            <p style={{ fontSize: 13, color: '#888780' }}>{ROLE_LABELS[profile.role]}</p>
          )}
        </div>

        {/* Active toggle */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>Account Active</p>
            <p style={{ fontSize: 11, color: '#888780' }}>Inactive users cannot sign in</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(v => !v)}
            style={{
              width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              background: isActive ? '#0f2416' : '#D3D1C7',
            }}
          >
            <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: isActive ? 21 : 3 }} />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        style={{ marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 10, background: isPending ? '#D3D1C7' : '#0f2416', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: isPending ? 'not-allowed' : 'pointer' }}
      >
        {isPending && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
