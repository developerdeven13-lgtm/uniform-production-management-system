import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import { PageTitle } from '@/components/shared/PageTitle'
import { MyTasksList } from '@/components/assignments/MyTasksList'

export default async function MyTasksPage() {
  // requireUser() is just for the session guard + role check (reads headers).
  // For the actual DB query we use supabase.auth.getUser() so the user ID
  // comes from the same JWT that Supabase RLS evaluates — avoids any mismatch.
  await requireUser()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [activeRes, completedRes] = await Promise.all([
    supabase
      .from('tailor_assignments')
      .select(`
        *,
        order_item:order_items(
          *,
          order:orders(
            id, order_number, delivery_date, priority, special_instructions,
            customer:customers(full_name, phone)
          )
        )
      `)
      .eq('tailor_id', user.id)
      .eq('is_active', true)
      .is('completed_at', null)
      .order('assigned_at', { ascending: true }),

    supabase
      .from('tailor_assignments')
      .select(`
        id, completed_at,
        order_item:order_items(
          id, product_type, quantity,
          order:orders(id, order_number, customer:customers(full_name))
        )
      `)
      .eq('tailor_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10),
  ])

  // Surface errors in dev so we know when the query itself fails
  if (activeRes.error) {
    console.error('[my-tasks] active query error:', activeRes.error)
  }
  if (completedRes.error) {
    console.error('[my-tasks] completed query error:', completedRes.error)
  }

  const active = activeRes.data ?? []
  const completed = completedRes.data ?? []

  return (
    <div className="space-y-5 max-w-7xl">
      <PageTitle
        count={active.length}
        label="Active"
        title={`Task${active.length !== 1 ? 's' : ''}`}
      />
      <MyTasksList active={active} completed={completed} />
    </div>
  )
}
