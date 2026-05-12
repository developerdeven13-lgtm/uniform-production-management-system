'use client'

import { Menu } from 'lucide-react'
import { logout } from '@/actions/auth'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import type { ServerUser } from '@/lib/auth/server-session'

interface TopBarProps {
  onMenuClick: () => void
  profile: ServerUser
}

export function TopBar({ onMenuClick, profile }: TopBarProps) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const firstName = profile.full_name.split(' ')[0]

  return (
    <header
      className="flex items-center justify-between px-5 sm:px-7 py-4 shrink-0"
      style={{ background: '#EDEBE4' }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg transition-colors mr-3"
        style={{ color: '#5F5E5A' }}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Greeting */}
      <div className="hidden sm:block">
        <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: '#888780' }}>
          {dateStr}
        </p>
        <p className="text-sm font-medium" style={{ color: '#2C2C2A' }}>
          {greeting}, {firstName}
        </p>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <NotificationBell userId={profile.id} />

        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors"
            style={{ color: '#5F5E5A', background: 'transparent' }}
            title={`Sign out (${profile.full_name})`}
            onMouseEnter={e => (e.currentTarget.style.background = '#F1EFE8')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  )
}
