import { AppShell } from '@/components/layout/AppShell'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { RightSidebarMobile } from '@/components/layout/RightSidebarMobile'
import { requireUser } from '@/lib/auth/server-session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <AppShell
      profile={user}
      rightSidebar={<RightSidebar />}
      mobileStats={<RightSidebarMobile />}
    >
      {children}
    </AppShell>
  )
}
