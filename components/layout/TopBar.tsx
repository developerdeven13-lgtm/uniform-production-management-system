'use client'

import { Menu, LogOut } from 'lucide-react'
import { logout } from '@/actions/auth'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { profile } = useCurrentUser()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {profile?.id && <NotificationBell userId={profile.id} />}

        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title={`Sign out${profile ? ` (${profile.full_name})` : ''}`}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  )
}
