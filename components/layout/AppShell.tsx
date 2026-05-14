'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils/cn'
import type { ServerUser } from '@/lib/auth/server-session'

interface AppShellProps {
  children: React.ReactNode
  profile: ServerUser
  rightSidebar?: React.ReactNode
}

export function AppShell({ children, profile, rightSidebar }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-full">
      {/* Desktop left sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar profile={profile} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex">
            <Sidebar profile={profile} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: '#EDEBE4' }}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} profile={profile} />
        <main className={cn('flex-1 overflow-y-auto p-5 sm:p-7')}>
          {children}
        </main>
      </div>

      {/* Right sidebar — desktop only (xl+), hidden on tablet/mobile */}
      {rightSidebar && (
        <div
          className="hidden xl:flex flex-col shrink-0 w-44 overflow-hidden"
          style={{ background: '#fff', borderLeft: '0.5px solid #D3D1C7' }}
        >
          {rightSidebar}
        </div>
      )}
    </div>
  )
}
