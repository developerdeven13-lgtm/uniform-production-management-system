import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { RightSidebarMobile } from '@/components/layout/RightSidebarMobile'
import { requireUser } from '@/lib/auth/server-session'
import { getUserPermissions } from '@/lib/permissions/user-permissions'

function SidebarSkeleton() {
  return (
    <div className="flex flex-col p-4 gap-5 animate-pulse">
      {[0, 1, 2].map(i => (
        <div key={i} className="space-y-2">
          <div className="h-2.5 w-20 rounded-full bg-[#E8E6DE]" />
          <div className="h-9 w-14 rounded-lg bg-[#E8E6DE]" />
          <div className="h-2.5 w-24 rounded-full bg-[#F1EFE8]" />
        </div>
      ))}
    </div>
  )
}

export default async function TailorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const permissions = await getUserPermissions(user.id, user.role)
  return (
    <AppShell
      profile={user}
      permissions={permissions}
      rightSidebar={
        <Suspense fallback={<SidebarSkeleton />}>
          <RightSidebar />
        </Suspense>
      }
      mobileStats={
        <Suspense fallback={null}>
          <RightSidebarMobile />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  )
}
