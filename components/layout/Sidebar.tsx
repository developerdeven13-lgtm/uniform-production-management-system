'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ClipboardList, UserCheck,
  Scissors, Layers, BarChart2, Settings, X, Stethoscope,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { can } from '@/lib/permissions/can'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { UserRole } from '@/types/app.types'
import type { Permission } from '@/lib/permissions/permissions'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Customers',
    href: '/customers',
    icon: Users,
    permission: 'customers.read',
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: ClipboardList,
    permission: 'orders.read.all',
  },
  {
    label: 'My Tasks',
    href: '/my-tasks',
    icon: Scissors,
    roles: ['tailor', 'tailor_master'],
  },
  {
    label: 'Embroidery Queue',
    href: '/queue',
    icon: Layers,
    roles: ['embroidery_staff', 'tailor_master', 'super_admin', 'admin'],
  },
  {
    label: 'Assignments',
    href: '/assignments',
    icon: UserCheck,
    permission: 'assignments.create',
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart2,
    permission: 'analytics.read',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: 'settings.manage',
  },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { profile } = useCurrentUser()
  const role = profile?.role as UserRole | undefined

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.roles) return role && item.roles.includes(role)
    if (item.permission) return can(role, item.permission)
    return true
  })

  return (
    <div className="flex flex-col h-full w-64" style={{ background: '#0f2e1e' }}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(52,211,153,0.18)' }}>
            <Stethoscope className="w-5 h-5" style={{ color: '#34d399' }} />
          </div>
          <div className="leading-tight">
            <p className="text-white font-semibold text-sm">Midas Health</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Uniform Production</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Menu
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              )}
              style={isActive
                ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' }
                : { color: 'rgba(255,255,255,0.55)' }
              }
            >
              <item.icon className={cn('w-4 h-4 shrink-0', isActive ? '' : 'opacity-70')} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      {profile && (
        <div className="px-3 py-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: '#34d399', color: '#0f2e1e' }}
            >
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-xs capitalize truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {profile.role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
