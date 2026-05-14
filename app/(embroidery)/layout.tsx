import { AppShell } from '@/components/layout/AppShell'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { requireUser } from '@/lib/auth/server-session'

export default async function EmbroideryLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <AppShell profile={user} rightSidebar={<RightSidebar />}>
      {children}
    </AppShell>
  )
}
