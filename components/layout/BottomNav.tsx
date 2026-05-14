'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, UserCheck,
  Menu, Plus, Scissors, Layers,
} from 'lucide-react'
import type { UserRole } from '@/types/app.types'

interface BottomNavProps {
  onMoreClick: () => void
  role: UserRole
}

/* Defined outside the component so React sees a stable component reference */
function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 relative py-1"
      style={{ color: active ? '#0f2416' : '#888780', textDecoration: 'none' }}
    >
      {active && (
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 w-7"
          style={{ height: 2, background: '#0f2416', borderRadius: '0 0 2px 2px' }}
        />
      )}
      <Icon className="w-5 h-5" />
      <span
        className="font-medium uppercase"
        style={{ fontSize: 9, letterSpacing: '0.07em' }}
      >
        {label}
      </span>
    </Link>
  )
}

export function BottomNav({ onMoreClick, role }: BottomNavProps) {
  const pathname = usePathname()

  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const isTailor = role === 'tailor' || role === 'tailor_master'
  const isEmbroidery = role === 'embroidery_staff'
  const canCreate = role === 'admin' || role === 'super_admin'

  const item2 = isTailor
    ? { label: 'My Tasks', href: '/my-tasks', icon: Scissors }
    : isEmbroidery
    ? { label: 'Queue', href: '/queue', icon: Layers }
    : { label: 'Orders', href: '/orders', icon: ClipboardList }

  const item4 = isTailor || isEmbroidery
    ? { label: 'Orders', href: '/orders', icon: ClipboardList }
    : { label: 'Assign', href: '/assignments', icon: UserCheck }

  return (
    <>
      {/* ── Bottom navigation bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch bg-white"
        style={{ borderTop: '0.5px solid #D3D1C7', height: 64 }}
        aria-label="Mobile navigation"
      >
        <NavItem href="/dashboard"  icon={LayoutDashboard} label="Home"       active={active('/dashboard')} />
        <NavItem href={item2.href}  icon={item2.icon}      label={item2.label} active={active(item2.href)} />

        {/* Gap for FAB */}
        <div style={{ width: 64, flexShrink: 0 }} />

        <NavItem href={item4.href}  icon={item4.icon}      label={item4.label} active={active(item4.href)} />

        {/* More */}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 active:bg-gray-50"
          style={{ color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="More options"
        >
          <Menu className="w-5 h-5" />
          <span
            className="font-medium uppercase"
            style={{ fontSize: 9, letterSpacing: '0.07em' }}
          >
            More
          </span>
        </button>
      </nav>

      {/* ── FAB ── */}
      {canCreate ? (
        <Link
          href="/orders/new"
          className="lg:hidden fixed z-40 flex items-center justify-center rounded-full shadow-lg"
          style={{
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 50,
            height: 50,
            background: '#0f2416',
          }}
          aria-label="New order"
        >
          <Plus className="w-5 h-5 text-white" />
        </Link>
      ) : (
        /* Placeholder keeps the gap intentional on non-admin roles */
        <div
          aria-hidden="true"
          className="lg:hidden fixed z-40 rounded-full"
          style={{
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 50,
            height: 50,
            background: 'rgba(15,36,22,0.07)',
          }}
        />
      )}
    </>
  )
}
