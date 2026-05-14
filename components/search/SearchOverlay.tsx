'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, Package, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import type { OrderStatus } from '@/types/app.types'

interface OrderResult {
  id: string
  order_number: string
  status: OrderStatus
  priority: number
  delivery_date: string | null
  // Supabase returns joined rows as an array even for many-to-one relations
  customer: { full_name: string }[] | null
}

interface CustomerResult {
  id: string
  full_name: string
  phone: string | null
  organization: string | null
}

interface SearchOverlayProps {
  onClose: () => void
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [orders, setOrders] = useState<OrderResult[]>([])
  const [customers, setCustomers] = useState<CustomerResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setOrders([])
        setCustomers([])
        setLoading(false)
        return
      }

      setLoading(true)
      const term = q.trim()

      const [ordersRes, customersRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, status, priority, delivery_date, customer:customers(full_name)')
          .ilike('order_number', `%${term}%`)
          .limit(6),
        supabase
          .from('customers')
          .select('id, full_name, phone, organization')
          .or(`full_name.ilike.%${term}%,organization.ilike.%${term}%,phone.ilike.%${term}%`)
          .limit(6),
      ])

      setOrders((ordersRes.data ?? []) as OrderResult[])
      setCustomers((customersRes.data ?? []) as CustomerResult[])
      setLoading(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, runSearch])

  const hasResults = orders.length > 0 || customers.length > 0
  const hasQuery = query.trim().length > 0

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(15,36,22,0.55)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Panel — slides down from top */}
      <div className="relative z-10 flex flex-col max-h-[85vh] overflow-hidden mx-auto w-full max-w-2xl mt-0 lg:mt-16 lg:rounded-2xl bg-white shadow-2xl">
        {/* Search input row */}
        <div
          className="flex items-center gap-3 px-4 sm:px-5 shrink-0"
          style={{ borderBottom: '0.5px solid #F1EFE8', height: 56 }}
        >
          <Search className="w-5 h-5 shrink-0" style={{ color: '#888780' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search orders, customers…"
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: '#2C2C2A' }}
          />
          {loading && (
            <div
              className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
              style={{ borderColor: '#D3D1C7', borderTopColor: '#0f2416' }}
            />
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors shrink-0 hover:bg-[#F1EFE8]"
            aria-label="Close search"
          >
            <X className="w-4 h-4" style={{ color: '#888780' }} />
          </button>
        </div>

        {/* Results scroll area */}
        <div className="flex-1 overflow-y-auto">
          {/* Empty / idle state */}
          {!hasQuery && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: '#F1EFE8' }}
              >
                <Search className="w-5 h-5" style={{ color: '#888780' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#2C2C2A' }}>
                Search orders &amp; customers
              </p>
              <p className="text-xs mt-1" style={{ color: '#888780' }}>
                Type an order number, customer name, or phone number
              </p>
            </div>
          )}

          {/* No results */}
          {hasQuery && !loading && !hasResults && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: '#F1EFE8' }}
              >
                <Search className="w-5 h-5" style={{ color: '#D3D1C7' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#2C2C2A' }}>
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs mt-1" style={{ color: '#888780' }}>
                Try a different order number, name, or phone
              </p>
            </div>
          )}

          <div className="px-3 sm:px-4 pb-4 pt-2 space-y-5">
            {/* Orders */}
            {orders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 mb-2">
                  <Package className="w-3.5 h-3.5" style={{ color: '#888780' }} />
                  <p
                    className="text-[9px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: '#888780' }}
                  >
                    Orders
                  </p>
                </div>
                <div className="space-y-1.5">
                  {orders.map(order => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[#F7F5EE] active:bg-[#F1EFE8]"
                      style={{ border: '0.5px solid #D3D1C7', background: '#fff' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-bold tracking-tight"
                          style={{ color: '#2C2C2A', fontFamily: 'monospace' }}
                        >
                          {order.order_number}
                        </p>
                        {order.customer?.[0] && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#888780' }}>
                            {order.customer[0].full_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <OrderStatusBadge
                          status={order.status}
                          className="text-[10px]"
                        />
                        {order.delivery_date && (
                          <p className="text-[10px] hidden sm:block" style={{ color: '#888780' }}>
                            {formatDate(order.delivery_date)}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: '#D3D1C7' }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Customers */}
            {customers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 mb-2">
                  <Users className="w-3.5 h-3.5" style={{ color: '#888780' }} />
                  <p
                    className="text-[9px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: '#888780' }}
                  >
                    Customers
                  </p>
                </div>
                <div className="space-y-1.5">
                  {customers.map(customer => {
                    const initials = customer.full_name
                      .split(' ')
                      .slice(0, 2)
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                    return (
                      <Link
                        key={customer.id}
                        href={`/customers/${customer.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[#F7F5EE] active:bg-[#F1EFE8]"
                        style={{ border: '0.5px solid #D3D1C7', background: '#fff' }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                          style={{ background: '#F1EFE8', color: '#5F5E5A' }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: '#2C2C2A' }}>
                            {customer.full_name}
                          </p>
                          {(customer.organization || customer.phone) && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: '#888780' }}>
                              {customer.organization ?? customer.phone}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: '#D3D1C7' }} />
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
