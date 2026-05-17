import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { requireUser } from '@/lib/auth/server-session'

function SidebarSkeleton() {
  return (
    <div className="flex flex-col p-4 gap-5 animate-pulse">
      {[44, 36, 36].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-2.5 w-20 rounded-full bg-[#E8E6DE]" />
          <div className="h-9 w-14 rounded-lg bg-[#E8E6DE]" />
          <div className="h-2.5 w-24 rounded-full bg-[#F1EFE8]" />
        </div>
      ))}
      <div className="space-y-3 mt-1">
        <div className="h-2.5 w-20 rounded-full bg-[#E8E6DE]" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#E8E6DE] shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-20 rounded bg-[#E8E6DE]" />
              <div className="h-2.5 w-12 rounded bg-[#F1EFE8]" />
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#E8E6DE]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function AdminLayout({
  children,
  sidebar,
  mobileSidebar,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
  mobileSidebar: React.ReactNode
}) {
  const user = await requireUser()
  return (
    <AppShell
      profile={user}
      rightSidebar={
        <Suspense fallback={<SidebarSkeleton />}>
          {sidebar}
        </Suspense>
      }
      mobileStats={
        <Suspense fallback={null}>
          {mobileSidebar}
        </Suspense>
      }
    >
      {children}
    </AppShell>
  )
}
