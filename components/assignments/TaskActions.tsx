'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Play, CheckCircle, Loader2 } from 'lucide-react'
import { markItemStarted, markItemComplete } from '@/actions/assignments'
import { RaiseFlagModal } from '@/components/flags/RaiseFlagModal'

interface Props {
  orderItemId: string
  isStarted: boolean
  orderId: string
  orderNumber: string
  itemLabel?: string
}

export function TaskActions({ orderItemId, isStarted, orderId, orderNumber, itemLabel }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleStart = () => {
    startTransition(async () => {
      const result = await markItemStarted(orderItemId)
      if (result.success) {
        toast.success('Task started — status updated to In Tailoring')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleComplete = () => {
    startTransition(async () => {
      const result = await markItemComplete(orderItemId)
      if (result.success) {
        toast.success('Item complete — moved to Quality Check')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {!isStarted ? (
        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '13px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: isPending ? '#D3D1C7' : '#0f2416', color: '#fff', border: 'none',
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending
            ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
            : <Play style={{ width: 15, height: 15 }} />}
          {isPending ? 'Starting…' : 'Start Task'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleComplete}
          disabled={isPending}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '13px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: isPending ? '#D3D1C7' : '#1D9E75', color: '#fff', border: 'none',
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending
            ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
            : <CheckCircle style={{ width: 15, height: 15 }} />}
          {isPending ? 'Completing…' : 'Mark Complete'}
        </button>
      )}

      <RaiseFlagModal
        orderId={orderId}
        orderItemId={orderItemId}
        orderNumber={orderNumber}
        itemLabel={itemLabel}
      />
    </div>
  )
}
