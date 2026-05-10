'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ClipboardList, UserCheck,
  Scissors, Layers, BarChart2, Settings, X,
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
    <div className="flex flex-col h-full bg-slate-900 text-white w-64">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm leading-tight">
            Uniform<br />
            <span className="text-slate-400 font-normal text-xs">Production</span>
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      {profile && (
        <div className="px-3 py-4 border-t border-slate-700 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-400 capitalize truncate">
                {profile.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
