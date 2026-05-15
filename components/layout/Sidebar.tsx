'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ClipboardList, UserCheck,
  Scissors, Layers, BarChart2, Settings, X, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { can } from '@/lib/permissions/can'
import { logout } from '@/actions/auth'
import type { UserRole } from '@/types/app.types'
import type { Permission } from '@/lib/permissions/permissions'
import type { ServerUser } from '@/lib/auth/server-session'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', href: '/customers', icon: Users, permission: 'customers.read' },
  { label: 'Orders', href: '/orders', icon: ClipboardList, permission: 'orders.read.all' },
  { label: 'My Tasks', href: '/my-tasks', icon: Scissors, roles: ['tailor', 'tailor_master'] },
  {
    label: 'Embroidery Queue', href: '/queue', icon: Layers,
    roles: ['embroidery_staff', 'tailor_master', 'super_admin', 'admin'],
  },
  { label: 'Assignments', href: '/assignments', icon: UserCheck, permission: 'assignments.create' },
  { label: 'Reports', href: '/reports', icon: BarChart2, permission: 'analytics.read' },
  { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
]

interface SidebarProps {
  profile: ServerUser
  onClose?: () => void
}

export function Sidebar({ profile, onClose }: SidebarProps) {
  const pathname = usePathname()
  const role = profile.role as UserRole

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.roles) return item.roles.includes(role)
    if (item.permission) return can(role, item.permission)
    return true
  })

  const initials = profile.full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col h-full lg:w-52 xl:w-60 2xl:w-75" style={{ background: '#0f2416' }}>
      {/* Logo */}
      <div
        className="flex items-center justify-between px-[18px] py-5 shrink-0"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}
      >
        <div>
          <p className="text-white font-bold text-[30px] leading-none tracking-tight">Medisewa</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Uniform Production
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-[9px] px-[10px] py-[9px] 2xl:py-[10px] rounded-[9px] text-xs 2xl:text-[17px] font-medium transition-all"
              style={
                isActive
                  ? { background: 'rgba(255,255,255,0.10)', color: '#fff' }
                  : { color: 'rgba(255,255,255,0.45)' }
              }
            >
              <item.icon className="w-[15px] h-[15px] shrink-0" />
              {item.label}
              {isActive && (
                <div className="ml-auto w-[5px] h-[5px] rounded-full shrink-0" style={{ background: '#34d399' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-4 pt-3 shrink-0" style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-[9px] px-3 py-[9px] rounded-[9px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
            style={{ background: '#34d399', color: '#0f2416' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{profile.full_name}</p>
            <p className="text-[9px] capitalize truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {profile.role.replace(/_/g, ' ')}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Sign out"
              className="p-1 rounded transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
