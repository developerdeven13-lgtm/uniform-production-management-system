import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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

interface CustomerOrdersSidebarProps {
  orders: CustomerOrder[]
  customerId: string
  customerName: string
}

export function CustomerOrdersSidebar({ orders, customerId, customerName }: CustomerOrdersSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid #F1EFE8' }}>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888780] mb-1">
          Other Orders
        </p>
        <p
          className="font-bold leading-tight text-[#0f2416]"
          style={{ fontSize: 15, letterSpacing: '-0.3px' }}
        >
          {customerName}
        </p>
        <p className="text-[10px] text-[#B4B2A9] mt-0.5">
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Scrollable order list */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {orders.map((order, i) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block px-4 py-3 hover:bg-[#FAFAF8] transition-colors"
            style={{ borderBottom: i < orders.length - 1 ? '0.5px solid #F1EFE8' : 'none', textDecoration: 'none' }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span
                className="font-bold leading-tight text-[#0f2416]"
                style={{ fontSize: 13, letterSpacing: '-0.4px', fontFamily: 'monospace', wordBreak: 'break-all' }}
              >
                {order.order_number}
              </span>
              <div className="shrink-0">
                <OrderStatusBadge status={order.status as OrderStatus} />
              </div>
            </div>
            <p className="text-[10px] text-[#5F5E5A]">
              {order.total_items} item{order.total_items !== 1 ? 's' : ''}
              {order.delivery_date && (
                <span className="text-[#888780]"> · Due {formatDate(order.delivery_date)}</span>
              )}
            </p>
            <p className="text-[9px] text-[#B4B2A9] mt-0.5">{formatDate(order.created_at)}</p>
          </Link>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: '0.5px solid #F1EFE8' }}>
        <Link
          href={`/customers/${customerId}`}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-[11px] font-medium transition-colors hover:bg-[#E8E6DF]"
          style={{ color: '#0f2416', background: '#F1EFE8', border: '0.5px solid #D3D1C7', textDecoration: 'none' }}
        >
          View all orders
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
