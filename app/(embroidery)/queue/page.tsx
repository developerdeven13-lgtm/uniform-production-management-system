import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import { getEmbroideryQueue } from '@/actions/embroidery'
import { EmbroideryQueueList } from '@/components/assignments/EmbroideryQueueList'

export default async function EmbroideryQueuePage() {
  await requireUser()
  const supabase = await createClient()

  // Get available embroidery staff for admin assignment
  const { data: embroideryStaff } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'embroidery_staff')
    .eq('is_active', true)
    .order('full_name')

  const queueResult = await getEmbroideryQueue()
  const queue = queueResult.success ? queueResult.data : []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Embroidery Queue</h1>
        <p className="text-sm text-slate-500 mt-0.5">{queue.length} item{queue.length !== 1 ? 's' : ''} pending</p>
      </div>

      <EmbroideryQueueList
        queue={queue}
        embroideryStaff={embroideryStaff ?? []}
      />
    </div>
  )
}
