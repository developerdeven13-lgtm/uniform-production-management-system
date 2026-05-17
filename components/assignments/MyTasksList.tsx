'use client'

import Link from 'next/link'
import { Calendar, AlertTriangle, CheckCircle, Play, Scissors, ChevronRight } from 'lucide-react'
import { PRODUCT_LABEL } from '@/lib/constants/products'
import { formatDate, formatRelativeTime } from '@/lib/utils/format-date'

interface ActiveAssignment {
  id: string
  assigned_at: string
  started_at: string | null
  estimated_hours: number | null
  order_item: {
    id: string
    product_type: string
    quantity: number
    color: string | null
    gender: string | null
    has_embroidery: boolean
    embroidery_name: string | null
    status: string
    order: {
      id: string
      order_number: string
      delivery_date: string | null
      priority: number
      customer: { full_name: string } | null
    } | null
  } | null
}

interface CompletedAssignment {
  id: string
  completed_at: string | null
  order_item: {
    id: string
    product_type: string
    quantity: number
    order: {
      id: string
      order_number: string
      customer: { full_name: string } | null
    } | null
  } | null
}

interface Props {
  active: unknown[]
  completed: unknown[]
}

const STATUS_DOT: Record<string, string> = {
  assigned:    '#85B7EB',
  in_tailoring:'#EF9F27',
  quality_check:'#ED93B1',
  ready:       '#5DCAA5',
  delivered:   '#1D9E75',
}

function ActiveCard({ a }: { a: ActiveAssignment }) {
  const item = a.order_item
  const order = item?.order
  if (!item || !order) return null

  const isStarted = Boolean(a.started_at)
  const dotColor = STATUS_DOT[item.status] ?? '#B4B2A9'

  const tags = [
    item.gender && item.gender !== 'unisex' ? (item.gender === 'female' ? 'Female' : 'Male') : null,
    item.color ?? null,
    item.has_embroidery ? (item.embroidery_name ? `Embroidery: ${item.embroidery_name}` : 'Embroidery') : null,
  ].filter(Boolean) as string[]

  return (
    <Link
      href={`/my-tasks/${a.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '0.5px solid rgba(255,255,255,0.75)',
          borderRadius: 14,
          boxShadow: '0 2px 12px rgba(15,36,22,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
          overflow: 'hidden',
          transition: 'box-shadow 0.15s',
        }}
        className="hover:shadow-md"
      >
        {/* Card header */}
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(211,209,199,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                {/* Status dot */}
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#0f2416', letterSpacing: '-0.3px' }}>
                  {order.order_number}
                </span>
                {order.priority === 1 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: '#FCEBEB', color: '#791F1F', border: '0.5px solid #F7C1C1' }}>
                    <AlertTriangle style={{ width: 9, height: 9 }} /> Urgent
                  </span>
                )}
                {isStarted && (
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: '#FAEEDA', color: '#633806', border: '0.5px solid #F5D199' }}>
                    In Progress
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#5F5E5A', fontWeight: 500 }}>
                {order.customer?.full_name ?? '—'}
              </p>
            </div>
            <ChevronRight style={{ width: 15, height: 15, color: '#C4C2B9', flexShrink: 0, marginTop: 2 }} />
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(211,209,199,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: tags.length > 0 ? 8 : 0 }}>
            <Scissors style={{ width: 12, height: 12, color: '#888780', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A' }}>
              {PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL] ?? item.product_type} × {item.quantity}
            </span>
          </div>

          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: '#F1EFE8', color: '#5F5E5A' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card footer */}
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#888780' }}>
            {formatRelativeTime(a.assigned_at)}
          </span>
          {order.delivery_date ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888780' }}>
              <Calendar style={{ width: 11, height: 11 }} />
              {formatDate(order.delivery_date)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export function MyTasksList({ active, completed }: Props) {
  const activeList = active as ActiveAssignment[]
  const completedList = completed as CompletedAssignment[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Active tasks */}
      {activeList.length === 0 ? (
        <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, padding: '48px 24px', textAlign: 'center' }}>
          <Scissors style={{ width: 32, height: 32, color: '#D3D1C7', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>No active assignments</p>
          <p style={{ fontSize: 12, color: '#888780', marginTop: 4 }}>Tasks assigned to you will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeList.map(a => <ActiveCard key={a.id} a={a} />)}
        </div>
      )}

      {/* Recently completed */}
      {completedList.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888780', marginBottom: 10 }}>
            Recently Completed
          </p>
          <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
            {completedList.map((a, idx) => {
              const item = a.order_item
              const order = item?.order
              if (!item || !order) return null
              return (
                <div
                  key={a.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: idx < completedList.length - 1 ? '0.5px solid #F1EFE8' : 'none' }}
                >
                  <CheckCircle style={{ width: 14, height: 14, color: '#1D9E75', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#2C2C2A' }}>
                    {order.order_number}
                  </span>
                  <span style={{ fontSize: 12, color: '#888780' }}>
                    {PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL] ?? item.product_type} × {item.quantity}
                  </span>
                  <span style={{ fontSize: 12, color: '#888780', marginLeft: 'auto' }}>
                    {order.customer?.full_name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
