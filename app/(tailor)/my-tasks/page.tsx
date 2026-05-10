import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MyTasksList } from '@/components/assignments/MyTasksList'

export default async function MyTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('tailor_assignments')
    .select(`
      *,
      order_item:order_items(
        *,
        order:orders(
          id, order_number, status, delivery_date, priority,
          customer:customers(full_name, phone)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-sm text-slate-500 mt-0.5">
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
