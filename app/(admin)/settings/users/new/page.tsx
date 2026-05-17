'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { createUser } from '@/actions/users'
import type { UserRole } from '@/types/app.types'

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin',           label: 'Admin',           description: 'Full access except system settings' },
  { value: 'support_staff',   label: 'Support Staff',   description: 'Manages customers and orders' },
  { value: 'tailor_master',   label: 'Tailor Master',   description: 'Oversees tailors and assignments' },
  { value: 'tailor',          label: 'Tailor',          description: 'Works assigned items, raises flags' },
  { value: 'embroidery_staff',label: 'Embroidery Staff','description': 'Handles embroidery tasks' },
]

export default function NewUserPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<UserRole>('tailor')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('role', role)

    startTransition(async () => {
      const result = await createUser(fd)
      if (result.success) {
        toast.success('User created successfully')
        router.push(`/settings/users/${result.data.id}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="max-w-lg" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Link href="/settings/users" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888780', textDecoration: 'none', marginBottom: 12 }}>
          <ChevronLeft style={{ width: 14, height: 14 }} /> Back to Users
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f2416', letterSpacing: '-0.5px' }}>Add Staff Account</h1>
        <p style={{ fontSize: 13, color: '#888780', marginTop: 4 }}>Create a new user and set their role. They can sign in immediately.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>

          {[
            { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith', required: true },
            { name: 'email',     label: 'Email',     type: 'email', placeholder: 'jane@example.com', required: true },
            { name: 'phone',     label: 'Phone',     type: 'tel',  placeholder: '+977 98...' },
            { name: 'password',  label: 'Password',  type: 'password', placeholder: 'min. 8 characters', required: true },
          ].map((field, i, arr) => (
            <div key={field.name} style={{ padding: '14px 18px', borderBottom: i < arr.length - 1 ? '0.5px solid #F1EFE8' : 'none' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', marginBottom: 6 }}>
                {field.label}{field.required && ' *'}
              </label>
              <input
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
                style={{ width: '100%', padding: '10px 0', fontSize: 14, color: '#2C2C2A', background: 'none', border: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Role selector */}
        <div style={{ margin: '20px 0 0' }}>
          <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', marginBottom: 10 }}>Role</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                  border: role === r.value ? '1.5px solid #0f2416' : '0.5px solid #D3D1C7',
                  background: role === r.value ? '#F1EFE8' : '#fff',
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A' }}>{r.label}</p>
                  <p style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{r.description}</p>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: role === r.value ? '5px solid #0f2416' : '1.5px solid #D3D1C7', flexShrink: 0, transition: 'all 0.1s' }} />
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, background: isPending ? '#D3D1C7' : '#0f2416', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: isPending ? 'not-allowed' : 'pointer' }}
        >
          {isPending ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : null}
          {isPending ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
