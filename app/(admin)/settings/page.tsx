import { requirePermission } from '@/lib/auth/require-permission'
import Link from 'next/link'
import {
  Users, ShieldCheck, Bell, Palette, Database, ChevronRight,
} from 'lucide-react'

const SETTING_GROUPS = [
  {
    label: 'People',
    items: [
      {
        href: '/settings/users',
        icon: Users,
        title: 'Staff & Users',
        description: 'Create accounts, assign roles, and manage per-user privileges.',
        badge: null,
      },
      {
        href: '/settings/users',
        icon: ShieldCheck,
        title: 'Roles & Permissions',
        description: 'View default permissions per role and override individual user access.',
        badge: null,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '#',
        icon: Bell,
        title: 'Notifications',
        description: 'Configure when and how staff receive alerts.',
        badge: 'Soon',
      },
      {
        href: '#',
        icon: Palette,
        title: 'Branding',
        description: 'Customise logo, colours, and print templates.',
        badge: 'Soon',
      },
      {
        href: '#',
        icon: Database,
        title: 'Data & Backup',
        description: 'Export production records and manage data retention.',
        badge: 'Soon',
      },
    ],
  },
]

export default async function SettingsPage() {
  const user = await requirePermission('settings.manage')

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: '#0f2416',
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 13, color: '#888780' }}>
          Manage your workspace, users, and system preferences.
        </p>
      </div>

      {/* Groups */}
      {SETTING_GROUPS.map(group => (
        <div key={group.label}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#888780',
              marginBottom: 10,
            }}
          >
            {group.label}
          </p>

          <div
            style={{
              background: '#fff',
              border: '0.5px solid #D3D1C7',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {group.items.map((item, idx, arr) => {
              const Icon = item.icon
              const isDisabled = item.href === '#'

              const inner = (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    borderBottom: idx < arr.length - 1 ? '0.5px solid #F1EFE8' : 'none',
                    transition: 'background 0.1s',
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'default' : 'pointer',
                  }}
                  className={isDisabled ? '' : 'hover:bg-[#F7F5EE]'}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: '#F1EFE8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: 17, height: 17, color: '#5F5E5A' }} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2A' }}>
                        {item.title}
                      </p>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            padding: '2px 6px',
                            borderRadius: 99,
                            background: '#F1EFE8',
                            color: '#888780',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  {!isDisabled && (
                    <ChevronRight style={{ width: 16, height: 16, color: '#C4C2B9', flexShrink: 0 }} />
                  )}
                </div>
              )

              return isDisabled ? (
                <div key={item.title}>{inner}</div>
              ) : (
                <Link key={item.title} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                  {inner}
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      {/* Account info footer */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 12,
          background: '#F7F5EE',
          border: '0.5px solid #E8E6DE',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#E0DDD4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#5F5E5A',
            flexShrink: 0,
          }}
        >
          {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A' }}>{user.full_name}</p>
          <p style={{ fontSize: 11, color: '#888780', textTransform: 'capitalize' }}>
            {user.role.replace(/_/g, ' ')}
          </p>
        </div>
      </div>
    </div>
  )
}
