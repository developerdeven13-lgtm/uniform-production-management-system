import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import { getTailorWorkload, getMyAssignments } from '@/actions/assignments'
import { TailorWorkloadCard } from '@/components/assignments/TailorWorkloadCard'
import { AssignmentBoard } from '@/components/assignments/AssignmentBoard'
import type { Profile } from '@/types/app.types'

export default async function AssignmentsPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const profile = { role: user.role }

  // Get unassigned (confirmed) order items
  const { data: unassignedItems } = await supabase
    .from('order_items')
    .select(`
      *,
      order:orders(id, order_number, customer:customers(full_name), delivery_date, priority),
      assignment:tailor_assignments(tailor_id, is_active)
    `)
    .in('status', ['draft', 'confirmed'])
    .order('created_at', { ascending: true })

  // Get tailors with workload
  const workloadResult = await getTailorWorkload()
  const workload = workloadResult.success ? workloadResult.data : []

  // Get available tailors list for the form
  const { data: tailors } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['tailor', 'tailor_master'])
    .eq('is_active', true)
    .order('full_name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assignment Board</h1>
        <p className="text-sm text-slate-500 mt-0.5">Assign tailors to confirmed order items</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tailor workload */}
        <div className="xl:col-span-1 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Tailor Workload
          </h2>
          {workload.length === 0 ? (
            <p className="text-sm text-slate-500">No tailors found.</p>
          ) : (
            workload.map(({ tailor, activeCount, completedCount }) => (
              <TailorWorkloadCard
                key={tailor.id}
                tailor={tailor}
                activeCount={activeCount}
                completedCount={completedCount}
              />
            ))
          )}
        </div>

        {/* Unassigned items */}
        <div className="xl:col-span-2 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Items Pending Assignment ({unassignedItems?.length ?? 0})
          </h2>
          <AssignmentBoard
            items={unassignedItems ?? []}
            tailors={(tailors ?? []) as Profile[]}
          />
        </div>
      </div>
    </div>
  )
}
