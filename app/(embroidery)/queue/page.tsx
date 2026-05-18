import { createClient } from '@/lib/supabase/server'
import { requireAnyPermission } from '@/lib/auth/require-permission'
import { getEmbroideryQueue } from '@/actions/embroidery'
import { EmbroideryQueueList } from '@/components/assignments/EmbroideryQueueList'

export default async function EmbroideryQueuePage() {
  await requireAnyPermission(['embroidery.update', 'embroidery.assign'])
  const supabase = await createClient()

  const { data: embroideryStaff } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'embroidery_staff')
    .eq('is_active', true)
    .order('full_name')

  const queueResult = await getEmbroideryQueue()
  const queue = queueResult.success ? queueResult.data : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f2416', letterSpacing: '-0.5px', lineHeight: 1 }}>
          Embroidery Queue
        </h1>
        <p style={{ fontSize: 11, color: '#888780', marginTop: 4 }}>
          {queue.length} item{queue.length !== 1 ? 's' : ''} pending
        </p>
      </div>

      <EmbroideryQueueList
        queue={queue}
        embroideryStaff={embroideryStaff ?? []}
      />
    </div>
  )
}
