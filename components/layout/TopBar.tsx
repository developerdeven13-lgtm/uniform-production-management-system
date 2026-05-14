'use client'

import { logout } from '@/actions/auth'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import type { ServerUser } from '@/lib/auth/server-session'

interface TopBarProps {
  profile: ServerUser
}

/**
 * Desktop-only top bar (hidden below lg).
 * The mobile header is rendered directly in AppShell so it sits completely
 * outside the flex/scroll ancestor chain — the only reliable way to avoid
 * iOS Safari routing touch events to the scroll container instead.
 */
export function TopBar({ profile }: TopBarProps) {
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

  return (
    <header
      className="hidden lg:flex items-center justify-between px-5 xl:px-7 py-4 shrink-0"
      style={{ background: '#EDEBE4' }}
    >
      <div>
        <p
          suppressHydrationWarning
          className="font-medium uppercase tracking-widest"
          style={{ fontSize: 10, color: '#888780' }}
        >
          {dateStr}
        </p>
        <p
          suppressHydrationWarning
          className="text-sm font-medium"
          style={{ color: '#2C2C2A' }}
        >
          {greeting}, {firstName}
        </p>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <NotificationBell userId={profile.id} />

        <form action={logout}>
          <button
            type="submit"
            className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-[#F1EFE8] transition-colors"
            style={{ color: '#5F5E5A' }}
            title={`Sign out (${profile.full_name})`}
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}
