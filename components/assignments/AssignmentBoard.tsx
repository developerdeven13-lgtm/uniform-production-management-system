'use client'

import React, { useState } from 'react'
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
      <div
        style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '0.5px solid rgba(255,255,255,0.7)',
          borderRadius: 14,
          boxShadow: '0 2px 12px rgba(15,36,22,0.06)',
          padding: '48px 24px',
          textAlign: 'center',
        } as React.CSSProperties}
      >
        <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>No items pending assignment.</p>
        <p style={{ fontSize: 11, color: '#888780', marginTop: 4 }}>Confirm orders first to make items available here.</p>
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
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '0.5px solid rgba(255,255,255,0.75)',
              borderRadius: 14,
              boxShadow: '0 2px 12px rgba(15,36,22,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
              overflow: 'hidden',
            } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : item.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 transition-colors text-left"
              style={{ background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(241,239,232,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
              <div className="px-5 pb-5 pt-4" style={{ borderTop: '0.5px solid rgba(211,209,199,0.6)' }}>
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
