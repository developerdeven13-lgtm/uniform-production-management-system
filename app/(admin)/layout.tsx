import { AppShell } from '@/components/layout/AppShell'
import { requireUser } from '@/lib/auth/server-session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return <AppShell profile={user}>{children}</AppShell>
}
