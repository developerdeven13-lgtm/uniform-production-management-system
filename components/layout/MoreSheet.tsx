'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  X, LogOut, BarChart2, Settings, Users, Layers,
  UserCheck, ClipboardList, Scissors,
} from 'lucide-react'
import { logout } from '@/actions/auth'
import type { ServerUser } from '@/lib/auth/server-session'
import type { UserRole } from '@/types/app.types'

interface MoreSheetProps {
  profile: ServerUser
  onClose: () => void
}

const SECONDARY_ITEMS: Record<string, { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  admin: [
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Embroidery Queue', href: '/queue', icon: Layers },
    { label: 'Reports', href: '/reports', icon: BarChart2 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  super_admin: [
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Embroidery Queue', href: '/queue', icon: Layers },
    { label: 'Reports', href: '/reports', icon: BarChart2 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  tailor: [
    { label: 'Orders', href: '/orders', icon: ClipboardList },
    { label: 'Embroidery Queue', href: '/queue', icon: Layers },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  tailor_master: [
    { label: 'Orders', href: '/orders', icon: ClipboardList },
    { label: 'Assignments', href: '/assignments', icon: UserCheck },
    { label: 'Embroidery Queue', href: '/queue', icon: Layers },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  embroidery_staff: [
    { label: 'My Tasks', href: '/my-tasks', icon: Scissors },
    { label: 'Orders', href: '/orders', icon: ClipboardList },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  support_staff: [
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Reports', href: '/reports', icon: BarChart2 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
}

export function MoreSheet({ profile, onClose }: MoreSheetProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger slide-up on next frame
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const role = profile.role as UserRole
  const items = SECONDARY_ITEMS[role] ?? []

  const initials = profile.full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="fixed inset-0 z-60 flex flex-col justify-end lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.45)',
          opacity: visible ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative bg-white z-10 transition-transform duration-300 ease-out"
        style={{
          borderRadius: '20px 20px 0 0',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D3D1C7' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '0.5px solid #F1EFE8' }}
        >
          <p className="text-[9px] font-medium uppercase tracking-widest text-[#888780]">
            Menu
          </p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-[#F1EFE8]"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[#888780]" />
          </button>
        </div>

        {/* User profile */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '0.5px solid #F1EFE8' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: '#34d399', color: '#0f2416' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-[#2C2C2A]">{profile.full_name}</p>
            <p className="text-xs capitalize text-[#888780]">
              {profile.role.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {items.length === 0 ? (
            <p className="px-3 py-4 text-xs text-[#888780]">No additional items</p>
          ) : (
            items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors hover:bg-[#F7F5EE] active:bg-[#F1EFE8]"
              >
                <item.icon className="w-4.5 h-4.5 shrink-0 text-[#5F5E5A]" />
                <span className="text-sm font-medium text-[#2C2C2A]">{item.label}</span>
              </Link>
            ))
          )}
        </div>

        {/* Sign out */}
        <div className="px-3 pb-8 pt-2 shrink-0" style={{ borderTop: '0.5px solid #F1EFE8' }}>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors text-left hover:bg-[#FCEBEB] active:bg-[#F7C1C1]"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0 text-[#E24B4A]" />
              <span className="text-sm font-medium" style={{ color: '#E24B4A' }}>
                Sign out
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
