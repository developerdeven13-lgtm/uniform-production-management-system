'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils/cn'
import type { ServerUser } from '@/lib/auth/server-session'

export function AppShell({ children, profile }: { children: React.ReactNode; profile: ServerUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
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
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} profile={profile} />
        <main className={cn('flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6')}>
          {children}
        </main>
      </div>
    </div>
  )
}
