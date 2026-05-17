import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface TailorRow {
  id: string
  full_name: string
  initials: string
  activeCount: number
  dotColor: string
}

export interface SidebarStats {
  totalOrders: number
  delivered: number
  urgent: number
  completionRate: number
  totalCustomers: number
  tailorRows: TailorRow[]
}

/*
 * unstable_cache persists the result across all requests for 30 seconds.
 * The admin client is used here because unstable_cache runs outside the
 * request scope (no cookies/headers available), so we bypass RLS with
 * the service-role key. Sidebar stats are global aggregates visible to
 * all admin roles, so bypassing RLS is safe here.
 *
 * Tag 'sidebar-stats' lets us revalidate immediately after mutations
 * (e.g., order status changes) by calling revalidateTag('sidebar-stats').
 */
export const getSidebarStats = unstable_cache(
  async (): Promise<SidebarStats> => {
    const supabase = createAdminClient()

    const [ordersRes, customersRes, tailorsRes, assignmentsRes] = await Promise.all([
      supabase.from('orders').select('status, priority'),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['tailor', 'tailor_master'])
        .eq('is_active', true)
        .order('full_name'),
      supabase
        .from('tailor_assignments')
        .select('tailor_id')
        .eq('is_active', true)
        .is('completed_at', null),
    ])

    const orders = ordersRes.data ?? []
    const totalOrders = orders.length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const urgent = orders.filter(o => o.priority === 1).length
    const completionRate = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0
    const totalCustomers = customersRes.count ?? 0

    const tailors = (tailorsRes.data ?? []).slice(0, 5)
    const activeAssignments = assignmentsRes.data ?? []

    const tailorRows: TailorRow[] = tailors.map(tailor => {
      const activeCount = activeAssignments.filter(a => a.tailor_id === tailor.id).length
      const load: 'free' | 'moderate' | 'busy' =
        activeCount === 0 ? 'free' : activeCount <= 3 ? 'moderate' : 'busy'
      const initials = tailor.full_name
        .split(' ')
        .slice(0, 2)
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
      const dotColor =
        load === 'free' ? '#1D9E75' : load === 'moderate' ? '#EF9F27' : '#E24B4A'
      return { id: tailor.id, full_name: tailor.full_name, initials, activeCount, dotColor }
    })

    return { totalOrders, delivered, urgent, completionRate, totalCustomers, tailorRows }
  },
  ['sidebar-stats'],
  { revalidate: 30, tags: ['sidebar-stats'] }
)
