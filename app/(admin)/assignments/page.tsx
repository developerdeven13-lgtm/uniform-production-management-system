import { createClient } from '@/lib/supabase/server'
import { requireAnyPermission } from '@/lib/auth/require-permission'
import { AssignmentBoard } from '@/components/assignments/AssignmentBoard'
import { PageTitle } from '@/components/shared/PageTitle'
import type { Profile } from '@/types/app.types'

export default async function AssignmentsPage() {
  await requireAnyPermission(['assignments.create', 'assignments.read'])
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

  const { data: tailors } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['tailor', 'tailor_master'])
    .eq('is_active', true)
    .order('full_name')

  const total = unassignedItems?.length ?? 0

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <PageTitle
        count={total}
        label="Pending"
        title={`Assignment${total !== 1 ? 's' : ''}`}
      />

      {/* Items pending assignment — height-capped + scrollable on mobile */}
      <div>
        <p
          style={{
            fontSize: 9,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#888780',
            marginBottom: 10,
          }}
        >
          Items Pending Assignment ({total})
        </p>
        <div className="max-h-[60vh] overflow-y-auto sm:max-h-none sm:overflow-y-visible">
          <AssignmentBoard
            items={unassignedItems ?? []}
            tailors={(tailors ?? []) as Profile[]}
          />
        </div>
      </div>
    </div>
  )
}
