import { AppShell } from '@/components/layout/AppShell'
import { requireUser } from '@/lib/auth/server-session'

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
      rightSidebar={sidebar}
      mobileStats={mobileSidebar}
    >
      {children}
    </AppShell>
  )
}
