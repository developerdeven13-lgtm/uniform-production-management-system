'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Package, Calendar, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { AssignmentForm } from './AssignmentForm'
import { PRODUCT_LABEL } from '@/lib/constants/products'
import { formatDate } from '@/lib/utils/format-date'
import type { Profile } from '@/types/app.types'

interface OrderItemRow {
  id: string
  product_type: string
  quantity: number
  color: string | null
  has_embroidery: boolean
  embroidery_name: string | null
  special_instructions: string | null
  order: {
    id: string
    order_number: string
    delivery_date: string | null
    priority: number
    customer: { full_name: string } | null
  } | null
  assignment: Array<{ tailor_id: string; is_active: boolean }> | null
}

interface AssignmentBoardProps {
  items: OrderItemRow[]
  tailors: Profile[]
}

export function AssignmentBoard({ items, tailors }: AssignmentBoardProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
        <p className="text-slate-500 text-sm">No items pending assignment.</p>
        <p className="text-xs text-slate-400 mt-1">Confirm orders first to make items available here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const isExpanded = expanded === item.id
        const currentAssignment = item.assignment?.find(a => a.is_active)

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : item.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 font-mono text-sm">
                      {item.order?.order_number}
                    </span>
                    {item.order?.priority === 1 && (
                      <span className="flex items-center gap-0.5 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL] ?? item.product_type}
                    {' '}&times; {item.quantity}
                    {item.color && <span className="text-slate-500"> · {item.color}</span>}
                    {item.has_embroidery && (
                      <span className="ml-1.5 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        Embroidery
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.order?.customer?.full_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {item.order?.delivery_date && (
                  <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.order.delivery_date)}
                  </div>
                )}
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />
                }
              </div>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                {item.special_instructions && (
                  <p className="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                    {item.special_instructions}
                  </p>
                )}
                <AssignmentForm
                  orderItemId={item.id}
                  orderId={item.order?.id ?? ''}
                  currentTailorId={currentAssignment?.tailor_id}
                  tailors={tailors}
                  onSuccess={() => {
                    setExpanded(null)
                    router.refresh()
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
