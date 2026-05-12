import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import { MyTasksList } from '@/components/assignments/MyTasksList'

export default async function MyTasksPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('tailor_assignments')
    .select(`
      *,
      order_item:order_items(
        *,
        order:orders(
          id, order_number, status, delivery_date, priority, special_instructions,
          customer:customers(full_name, phone),
          media:media_attachments(*)
        ),
        measurements:order_measurements(*),
        media:media_attachments(*)
      )
    `)
    .eq('tailor_id', user.id)
    .eq('is_active', true)
    .is('completed_at', null)
    .order('assigned_at', { ascending: true })

  const completedData = await supabase
    .from('tailor_assignments')
    .select(`
      *,
      order_item:order_items(
        id, product_type, quantity,
        order:orders(id, order_number, customer:customers(full_name))
      )
    `)
    .eq('tailor_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f2416', letterSpacing: '-0.5px', lineHeight: 1 }}>
          My Tasks
        </h1>
        <p style={{ fontSize: 11, color: '#888780', marginTop: 4 }}>
          {data?.length ?? 0} active assignment{data?.length !== 1 ? 's' : ''}
        </p>
      </div>

      <MyTasksList
        active={data ?? []}
        completed={completedData.data ?? []}
      />
    </div>
  )
}
