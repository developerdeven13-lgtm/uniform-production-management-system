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

const STATUS_BUTTON_STYLE: Partial<Record<OrderStatus, string>> = {
  confirmed: 'bg-blue-600 hover:bg-blue-700 text-white',
  assigned: 'bg-purple-600 hover:bg-purple-700 text-white',
  in_tailoring: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  in_embroidery: 'bg-orange-500 hover:bg-orange-600 text-white',
  quality_check: 'bg-pink-600 hover:bg-pink-700 text-white',
  ready: 'bg-green-600 hover:bg-green-700 text-white',
  delivered: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  cancelled: 'bg-red-600 hover:bg-red-700 text-white',
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
      <p className="text-xs text-slate-500 mr-1">Actions:</p>
      {roleTransitions.map(toStatus => (
        <button
          key={toStatus}
          onClick={() => advance(toStatus)}
          disabled={loading !== null}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
            STATUS_BUTTON_STYLE[toStatus] ?? 'bg-slate-600 hover:bg-slate-700 text-white'
          }`}
        >
          {loading === toStatus && <Loader2 className="w-3 h-3 animate-spin" />}
          → {STATUS_LABEL[toStatus]}
        </button>
      ))}
    </div>
  )
}
