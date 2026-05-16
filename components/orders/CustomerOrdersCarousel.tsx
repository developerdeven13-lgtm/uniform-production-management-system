'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatDate } from '@/lib/utils/format-date'
import type { OrderStatus } from '@/types/app.types'

interface CustomerOrder {
  id: string
  order_number: string
  status: string
  delivery_date: string | null
  total_items: number
  created_at: string
}

interface CustomerOrdersCarouselProps {
  orders: CustomerOrder[]
  customerId: string
  customerName: string
}

export function CustomerOrdersCarousel({ orders, customerId, customerName }: CustomerOrdersCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' })
  }

  if (orders.length === 0) return null

  return (
    <div
      style={{
        background: '#fff',
        border: '0.5px solid #D3D1C7',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '14px 18px', borderBottom: '0.5px solid #F1EFE8' }}
      >
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780' }}>
            Orders from {customerName}
          </p>
          <p style={{ fontSize: 10, color: '#B4B2A9', marginTop: 1 }}>
            {orders.length} other order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orders.length > 1 && (
            <div className="flex gap-1">
              <button
                onClick={() => scroll('left')}
                className="flex items-center justify-center transition-colors"
                style={{ width: 28, height: 28, borderRadius: 8, background: '#F7F5EE', border: '0.5px solid #D3D1C7', color: '#5F5E5A' }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="flex items-center justify-center transition-colors"
                style={{ width: 28, height: 28, borderRadius: 8, background: '#F7F5EE', border: '0.5px solid #D3D1C7', color: '#5F5E5A' }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <Link
            href={`/customers/${customerId}`}
            className="flex items-center gap-1"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#0f2416',
              padding: '5px 12px',
              borderRadius: 8,
              background: '#F1EFE8',
              border: '0.5px solid #D3D1C7',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div style={{ padding: '14px 18px' }}>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto"
          style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 2 }}
        >
          {orders.map(order => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              style={{
                flexShrink: 0,
                width: 180,
                background: '#FAFAF8',
                border: '0.5px solid #D3D1C7',
                borderRadius: 12,
                padding: '12px 14px',
                textDecoration: 'none',
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {/* Order number + status */}
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.5px', color: '#0f2416', fontFamily: 'monospace', marginBottom: 6 }}>
                  {order.order_number}
                </p>
                <OrderStatusBadge status={order.status as OrderStatus} className="text-[10px]" />
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <p style={{ fontSize: 10, color: '#5F5E5A' }}>
                  {order.total_items} item{order.total_items !== 1 ? 's' : ''}
                </p>
                {order.delivery_date ? (
                  <p style={{ fontSize: 10, color: '#888780' }}>
                    Due {formatDate(order.delivery_date)}
                  </p>
                ) : (
                  <p style={{ fontSize: 10, color: '#B4B2A9' }}>No due date</p>
                )}
                <p style={{ fontSize: 9, color: '#B4B2A9', marginTop: 1 }}>
                  {formatDate(order.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
