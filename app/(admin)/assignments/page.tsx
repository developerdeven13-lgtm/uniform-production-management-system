import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import { getTailorWorkload } from '@/actions/assignments'
import { TailorWorkloadCard } from '@/components/assignments/TailorWorkloadCard'
import { AssignmentBoard } from '@/components/assignments/AssignmentBoard'
import type { Profile } from '@/types/app.types'

export default async function AssignmentsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: unassignedItems } = await supabase
    .from('order_items')
    .select(`
      *,
      order:orders(id, order_number, customer:customers(full_name), delivery_date, priority),
      assignment:tailor_assignments(tailor_id, is_active)
    `)
    .in('status', ['draft', 'confirmed'])
    .order('created_at', { ascending: true })

  const workloadResult = await getTailorWorkload()
  const workload = workloadResult.success ? workloadResult.data : []

  const { data: tailors } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['tailor', 'tailor_master'])
    .eq('is_active', true)
    .order('full_name')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f2416', letterSpacing: '-0.5px', lineHeight: 1 }}>
          Assignment Board
        </h1>
        <p style={{ fontSize: 11, color: '#888780', marginTop: 4 }}>
          Assign tailors to confirmed order items
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Tailor workload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888780' }}>
            Tailor Workload
          </p>
          {workload.length === 0 ? (
            <p style={{ fontSize: 12, color: '#888780' }}>No tailors found.</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888780' }}>
            Items Pending Assignment ({unassignedItems?.length ?? 0})
          </p>
          <AssignmentBoard
            items={unassignedItems ?? []}
            tailors={(tailors ?? []) as Profile[]}
          />
        </div>
      </div>
    </div>
  )
}
