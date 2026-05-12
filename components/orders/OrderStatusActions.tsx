'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { transitionOrderStatus } from '@/actions/orders'
import { ORDER_STATUS_TRANSITIONS } from '@/types/app.types'
import { STATUS_LABEL } from '@/lib/constants/order-statuses'
import type { Order, OrderStatus, UserRole } from '@/types/app.types'
import { Loader2 } from 'lucide-react'

interface OrderStatusActionsProps {
  order: Pick<Order, 'id' | 'status'>
  userRole: string
}

const STATUS_ACTION_STYLE: Partial<Record<OrderStatus, { background: string; color: string }>> = {
  confirmed:     { background: '#E6F1FB', color: '#0C447C' },
  assigned:      { background: '#EEEDFE', color: '#3C3489' },
  in_tailoring:  { background: '#FAEEDA', color: '#633806' },
  in_embroidery: { background: '#EEEDFE', color: '#3C3489' },
  quality_check: { background: '#FAEEDA', color: '#633806' },
  ready:         { background: '#E1F5EE', color: '#085041' },
  delivered:     { background: '#EAF3DE', color: '#27500A' },
  cancelled:     { background: '#FCEBEB', color: '#791F1F' },
}

export function OrderStatusActions({ order, userRole }: OrderStatusActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<OrderStatus | null>(null)

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus]
  const roleTransitions = allowedTransitions?.[userRole as UserRole] ?? []

  if (roleTransitions.length === 0) return null

  const advance = async (toStatus: OrderStatus) => {
    setLoading(toStatus)
    try {
      const result = await transitionOrderStatus(order.id, toStatus)
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success(`Order moved to ${STATUS_LABEL[toStatus]}`)
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-medium uppercase tracking-wider mr-1" style={{ color: '#888780' }}>
        Move to
      </span>
      {roleTransitions.map(toStatus => {
        const style = STATUS_ACTION_STYLE[toStatus] ?? { background: '#F1EFE8', color: '#444441' }
        return (
          <button
            key={toStatus}
            onClick={() => advance(toStatus)}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-opacity disabled:opacity-50"
            style={style}
          >
            {loading === toStatus && <Loader2 className="w-3 h-3 animate-spin" />}
            {STATUS_LABEL[toStatus]}
          </button>
        )
      })}
    </div>
  )
}
