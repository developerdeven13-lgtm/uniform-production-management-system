'use client'

import { useState, useCallback } from 'react'
import { ChevronRight, Menu, Search } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { MoreSheet } from './MoreSheet'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import { cn } from '@/lib/utils/cn'
import type { ServerUser } from '@/lib/auth/server-session'
import type { UserRole } from '@/types/app.types'

interface AppShellProps {
  children: React.ReactNode
  profile: ServerUser
  rightSidebar?: React.ReactNode
  mobileStats?: React.ReactNode
}

export function AppShell({ children, profile, rightSidebar, mobileStats }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [rightOpen, setRightOpen]         = useState(true)
  const [searchOpen, setSearchOpen]       = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)

  const openSidebar  = useCallback(() => setSidebarOpen(true),   [])
  const closeSidebar = useCallback(() => setSidebarOpen(false),  [])
  const openSearch   = useCallback(() => setSearchOpen(true),    [])
  const closeSearch  = useCallback(() => setSearchOpen(false),   [])
  const openMore     = useCallback(() => setMoreSheetOpen(true), [])
  const closeMore    = useCallback(() => setMoreSheetOpen(false),[])
  const toggleRight  = useCallback(() => setRightOpen(v => !v), [])

  return (
    <>
      {/*
       * ── MOBILE HEADER ──────────────────────────────────────────────────
       * Rendered as a Fragment sibling of the entire flex shell — completely
       * outside every scroll container and flex ancestor. iOS Safari routes
       * touch events to the scroll container when the fixed element shares a
       * DOM ancestor with it; this layout avoids that entirely.
       *
       * Only visible below the lg breakpoint (lg:hidden).
       */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 flex items-center gap-2 px-4"
        style={{ background: '#0f2416', height: 54, zIndex: 100 }}
      >
        <button
          type="button"
          onClick={openSidebar}
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.85)' }}
          aria-label="Open menu"
        >
          <Menu style={{ width: 20, height: 20 }} />
        </button>

        <span
          className="font-bold text-white"
          style={{ fontSize: 17, letterSpacing: '-0.7px', flex: 1 }}
        >
          Medisewa<span style={{ color: '#34d399' }}>.</span>
        </span>

        <button
          type="button"
          onClick={openSearch}
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{
            width: 40,
            height: 40,
            color: 'rgba(255,255,255,0.85)',
            border: '0.5px solid rgba(255,255,255,0.18)',
          }}
          aria-label="Search"
        >
          <Search style={{ width: 18, height: 18 }} />
        </button>

        <div className="shrink-0">
          <NotificationBell userId={profile.id} className="text-white/85" />
        </div>
      </header>

      {/* ── APP SHELL ──────────────────────────────────────────────────────── */}
      <div className="flex h-full">

        {/* Desktop left sidebar */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar profile={profile} />
        </div>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/50" onClick={closeSidebar} />
            <div className="relative z-50 flex">
              <Sidebar profile={profile} onClose={closeSidebar} />
            </div>
          </div>
        )}

        {/* Centre column */}
        <div className="flex flex-col flex-1 min-w-0" style={{ background: '#EDEBE4' }}>
          {/* Desktop-only topbar (inside the flex flow) */}
          <TopBar profile={profile} onSearchClick={openSearch} />

          {/*
           * pt-17.5 on mobile = 54 px fixed header + 16 px gap
           * pb-20 clears the fixed bottom nav (64 px) + 16 px buffer
           */}
          <main className="flex-1 overflow-y-auto p-4 pt-17.5 sm:p-6 sm:pt-19.5 lg:p-7 lg:pt-7 pb-20 lg:pb-7">
            {children}
            {mobileStats}
          </main>
        </div>

        {/* Right sidebar — desktop xl+ only */}
        {rightSidebar && (
          <div
            className={cn(
              'hidden xl:flex flex-col shrink-0 overflow-hidden',
              'transition-[width] duration-200 ease-in-out',
              rightOpen ? 'w-60 2xl:w-80' : 'w-9'
            )}
            style={{ background: '#fff', borderLeft: '0.5px solid #D3D1C7' }}
          >
            <button
              type="button"
              onClick={toggleRight}
              className="flex items-center justify-start shrink-0 w-6 h-6 rounded-full ml-auto mt-5 mb-1 hover:bg-[#F1EFE8] transition-colors"
              aria-label={rightOpen ? 'Collapse right sidebar' : 'Expand right sidebar'}
            >
              <ChevronRight
                className={cn(
                  'w-3.5 h-3.5 text-[#888780] transition-transform duration-200',
                  !rightOpen && 'rotate-180'
                )}
              />
            </button>
            {rightOpen && (
              <div className="flex-1 overflow-y-auto">
                {rightSidebar}
              </div>
            )}
          </div>
        )}

        {/* Mobile bottom nav + FAB */}
        <BottomNav onMoreClick={openMore} role={profile.role as UserRole} />

        {/* Global overlays */}
        {searchOpen    && <SearchOverlay onClose={closeSearch} />}
        {moreSheetOpen && <MoreSheet profile={profile} onClose={closeMore} />}

      </div>
    </>
  )
}
