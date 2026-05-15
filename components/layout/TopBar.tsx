'use client'

import Link from 'next/link'
import { Search, Plus } from 'lucide-react'
import { logout } from '@/actions/auth'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { can } from '@/lib/permissions/can'
import type { ServerUser } from '@/lib/auth/server-session'
import type { UserRole } from '@/types/app.types'

interface TopBarProps {
  profile: ServerUser
  onSearchClick: () => void
}

/**
 * Desktop-only top bar (hidden below lg).
 * The mobile header lives directly in AppShell so it has no scroll/flex
 * ancestor — the only reliable fix for iOS touch-event routing.
 */
export function TopBar({ profile, onSearchClick }: TopBarProps) {
  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const firstName = profile.full_name.split(' ')[0]
  const canCreateOrder = can(profile.role as UserRole, 'orders.create')

  return (
    <header
      className="hidden lg:flex items-center gap-3 px-5 xl:px-7 py-4 shrink-0"
      style={{ background: '#EDEBE4' }}
    >
      {/* Greeting */}
      <div>
        <p
          suppressHydrationWarning
          className="font-medium uppercase tracking-widest text-[10px] 2xl:text-[12px]"
          style={{ color: '#888780' }}
        >
          {dateStr}
        </p>
        <p
          suppressHydrationWarning
          className="text-[15px] 2xl:text-[20px] font-medium"
          style={{ color: '#2C2C2A' }}
        >
          {greeting}, {firstName}
        </p>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2 2xl:gap-3">
        {/* Search */}
        <button
          type="button"
          onClick={onSearchClick}
          className="flex items-center justify-center rounded-[9px] transition-colors hover:bg-[#F1EFE8]"
          style={{
            width: 34,
            height: 34,
            border: '0.5px solid #D3D1C7',
            background: '#fff',
            color: '#5F5E5A',
          }}
          aria-label="Search"
        >
          <Search style={{ width: 16, height: 16 }} />
        </button>

        {/* Notification bell */}
        <NotificationBell userId={profile.id} />

        {/* New Order — only for roles with orders.create permission */}
        {canCreateOrder && (
          <Link
            href="/orders/new"
            className="flex items-center gap-1.5 px-4 py-2 text-xs 2xl:text-[15px] font-medium rounded-[9px] text-white transition-opacity hover:opacity-90"
            style={{ background: '#0f2416' }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            New Order
          </Link>
        )}

        {/* Sign out */}
        {/* <form action={logout}>
          <button
            type="submit"
            className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-[#F1EFE8] transition-colors"
            style={{ color: '#5F5E5A' }}
            title={`Sign out (${profile.full_name})`}
          >
            Sign out
          </button>
        </form> */}
      </div>
    </header>
  )
}
