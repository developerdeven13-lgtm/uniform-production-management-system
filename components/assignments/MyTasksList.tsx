'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Scissors, Calendar, AlertTriangle, Play, CheckCircle, Clock } from 'lucide-react'
import { markItemStarted, markItemComplete } from '@/actions/assignments'
import { PRODUCT_LABEL } from '@/lib/constants/products'
import { formatDate, formatRelativeTime } from '@/lib/utils/format-date'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import type { OrderStatus } from '@/types/app.types'
import Link from 'next/link'

interface Assignment {
  id: string
  started_at: string | null
  assigned_at: string
  estimated_hours: number | null
  order_item: {
    id: string
    product_type: string
    quantity: number
    color: string | null
    has_embroidery: boolean
    embroidery_name: string | null
    special_instructions: string | null
    status: string
    order: {
      id: string
      order_number: string
      status: string
      delivery_date: string | null
      priority: number
      customer: { full_name: string; phone: string } | null
    } | null
    measurements: Record<string, unknown> | null
  } | null
}

interface MyTasksListProps {
  active: unknown[]
  completed: unknown[]
}

function TaskCard({ assignment }: { assignment: Assignment }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const item = assignment.order_item
  const order = item?.order

  if (!item || !order) return null

  const isStarted = Boolean(assignment.started_at)

  const handleStart = () => {
    startTransition(async () => {
      const result = await markItemStarted(item.id)
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
      const result = await markItemComplete(item.id)
      if (result.success) {
        toast.success('Item marked complete — moved to Quality Check')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/orders/${order.id}`}
                className="font-semibold text-slate-900 font-mono text-sm hover:text-blue-600"
              >
                {order.order_number}
              </Link>
              {order.priority === 1 && (
                <span className="flex items-center gap-0.5 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Urgent
                </span>
              )}
              <OrderStatusBadge status={item.status as OrderStatus} />
            </div>
            <p className="text-sm text-slate-600 mt-0.5">{order.customer?.full_name}</p>
          </div>
          {order.delivery_date && (
            <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
              <Calendar className="w-3 h-3" />
              {formatDate(order.delivery_date)}
            </div>
          )}
        </div>
      </div>

      {/* Item details */}
      <div className="px-5 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-900">
            {PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL]} &times; {item.quantity}
          </span>
          {item.color && <span className="text-sm text-slate-500">· {item.color}</span>}
          {item.has_embroidery && (
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
              Embroidery{item.embroidery_name ? `: ${item.embroidery_name}` : ''}
            </span>
          )}
        </div>

        {/* Measurements */}
        {item.measurements && (
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-slate-500 mb-1.5">Measurements (cm)</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(item.measurements)
                .filter(([k, v]) =>
                  !['id','order_item_id','customer_id','product_type','custom_measurements','notes','measured_by','measured_at','created_at','updated_at','prefilled_from_profile'].includes(k)
                  && v !== null
                )
                .map(([k, v]) => (
                  <div key={k} className="text-center">
                    <p className="text-[10px] text-slate-400 capitalize">{k.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-semibold text-slate-800">{String(v)}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {item.special_instructions && (
          <p className="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded px-3 py-2">
            {item.special_instructions}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Assigned {formatRelativeTime(assignment.assigned_at)}
          </span>
          {assignment.estimated_hours && (
            <span>Est: {assignment.estimated_hours}h</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-slate-100 flex gap-2">
        {!isStarted ? (
          <button
            onClick={handleStart}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Task
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Complete
          </button>
        )}
      </div>
    </div>
  )
}

export function MyTasksList({ active, completed }: MyTasksListProps) {
  return (
    <div className="space-y-6">
      {/* Active tasks */}
      {(active as Assignment[]).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-14 text-center">
          <Scissors className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No active assignments.</p>
          <p className="text-xs text-slate-400 mt-1">Tasks assigned to you will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(active as Assignment[]).map(a => (
            <TaskCard key={a.id} assignment={a} />
          ))}
        </div>
      )}

      {/* Recently completed */}
      {(completed as Assignment[]).length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-500 text-sm uppercase tracking-wide mb-3">
            Recently Completed
          </h2>
          <div className="space-y-2">
            {(completed as Assignment[]).map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 opacity-60">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm font-mono text-slate-700">
                  {a.order_item?.order?.order_number}
                </span>
                <span className="text-sm text-slate-500">
                  {PRODUCT_LABEL[a.order_item?.product_type as keyof typeof PRODUCT_LABEL] ?? a.order_item?.product_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
