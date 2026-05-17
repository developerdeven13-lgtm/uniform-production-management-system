import { requireUser } from '@/lib/auth/server-session'
import { createClient } from '@/lib/supabase/server'
import { getEmbroideryQueue } from '@/actions/embroidery'
import { EmbroideryQueueList } from '@/components/assignments/EmbroideryQueueList'
import { PageTitle } from '@/components/shared/PageTitle'
import type { Profile } from '@/types/app.types'

export default async function EmbroideryQueuePage() {
  await requireUser()
  const supabase = await createClient()

  const [queueResult, staffRes] = await Promise.all([
    getEmbroideryQueue(),
    supabase
      .from('profiles')
      .select('*')
      .in('role', ['embroidery_staff', 'admin', 'super_admin'])
      .eq('is_active', true)
      .order('full_name'),
  ])

  const queue = queueResult.success ? queueResult.data : []
  const embroideryStaff = (staffRes.data ?? []) as Profile[]
  const total = queue.length

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <PageTitle count={total} label="Active" title="Embroidery" />

      {/* Queue */}
      {total === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '0.5px solid #D3D1C7',
            borderRadius: 14,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>
            No embroidery tasks in queue
          </p>
          <p style={{ fontSize: 11, color: '#888780', marginTop: 4 }}>
            Items requiring embroidery will appear here once they reach the embroidery stage.
          </p>
        </div>
      ) : (
        <EmbroideryQueueList queue={queue} embroideryStaff={embroideryStaff} />
      )}
    </div>
  )
}
