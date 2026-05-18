import { AppShell } from '@/components/layout/AppShell'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { RightSidebarMobile } from '@/components/layout/RightSidebarMobile'
import { requireUser } from '@/lib/auth/server-session'
import { getUserPermissions } from '@/lib/permissions/user-permissions'

export default async function EmbroideryLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const permissions = await getUserPermissions(user.id, user.role)
  return (
    <AppShell
      profile={user}
      permissions={permissions}
      rightSidebar={<RightSidebar />}
      mobileStats={<RightSidebarMobile />}
    >
      {children}
    </AppShell>
  )
}
