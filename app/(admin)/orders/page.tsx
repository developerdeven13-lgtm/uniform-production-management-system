import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatDate } from '@/lib/utils/format-date'
import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import type { Order, OrderStatus } from '@/types/app.types'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const query = params.q ?? ''
  const statusFilter = params.status ?? ''
  const priorityFilter = params.priority ?? ''
  const page = Number(params.page ?? '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let dbQuery = supabase
    .from('orders')
    .select('*, customer:customers(id, full_name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (statusFilter) dbQuery = dbQuery.eq('status', statusFilter)
  if (priorityFilter === 'urgent') dbQuery = dbQuery.eq('priority', 1)
  if (query) dbQuery = dbQuery.textSearch('search_vector', query, { type: 'plain' })

  const { data: orders, count } = await dbQuery
  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  function buildUrl(overrides: { status?: string; priority?: string; page?: number; q?: string }) {
    const p = new URLSearchParams()
    const s = overrides.status !== undefined ? overrides.status : statusFilter
    const pr = overrides.priority !== undefined ? overrides.priority : priorityFilter
    const q2 = overrides.q !== undefined ? overrides.q : query
    const pg = overrides.page ?? 1
    if (s) p.set('status', s)
    if (pr) p.set('priority', pr)
    if (q2) p.set('q', q2)
    if (pg > 1) p.set('page', String(pg))
    const str = p.toString()
    return `/orders${str ? `?${str}` : ''}`
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} order{total !== 1 ? 's' : ''} found</p>
        </div>
        <Link
          href="/orders/new"
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: '#0f2e1e' }}
        >
          <Plus className="w-4 h-4" />
          New Order
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        {/* Search bar */}
        <form method="GET" className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by order number, customer name…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-slate-50 placeholder:text-slate-400"
            style={{ '--tw-ring-color': '#34d399' } as React.CSSProperties}
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {priorityFilter && <input type="hidden" name="priority" value={priorityFilter} />}
        </form>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* All */}
          <Link
            href="/orders"
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              !statusFilter && !priorityFilter
                ? 'text-white border-transparent'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            style={!statusFilter && !priorityFilter ? { background: '#0f2e1e' } : {}}
          >
            All
          </Link>

          {/* Urgent */}
          <Link
            href={buildUrl({ priority: priorityFilter === 'urgent' ? '' : 'urgent', status: '', page: 1 })}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              priorityFilter === 'urgent'
                ? 'bg-red-600 text-white border-red-600'
                : 'border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Urgent
          </Link>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* Status filters */}
          {ORDER_STATUSES.map(s => (
            <Link
              key={s.value}
              href={buildUrl({ status: statusFilter === s.value ? '' : s.value, page: 1 })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === s.value
                  ? 'text-white border-transparent'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              style={statusFilter === s.value ? { background: '#0f2e1e' } : {}}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {!orders || orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No orders found</p>
            <p className="text-slate-400 text-xs mt-1 mb-4">
              {statusFilter || priorityFilter ? 'Try adjusting your filters.' : 'Get started by creating your first order.'}
            </p>
            {!statusFilter && !priorityFilter && (
              <Link
                href="/orders/new"
                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ color: '#0f2e1e' }}
              >
                <Plus className="w-3.5 h-3.5" /> Create first order
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100" style={{ background: '#f8faf9' }}>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Order #</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide hidden sm:table-cell">Items</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">Delivery</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(orders as (Order & { customer: { full_name: string; phone: string } | null })[]).map(order => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{order.order_number}</span>
                      {order.priority === 1 && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">
                          <AlertTriangle className="w-2.5 h-2.5" /> Urgent
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900 text-sm">{order.customer?.full_name ?? '—'}</p>
                    <p className="text-xs text-slate-400">{order.customer?.phone}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <OrderStatusBadge status={order.status as OrderStatus} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 hidden sm:table-cell">{order.total_items}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs hidden md:table-cell">
                    {order.delivery_date ? formatDate(order.delivery_date) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs hidden md:table-cell">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-[#0f2e1e] hover:text-white hover:border-[#0f2e1e] transition-all"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: page - 1 })}
                className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: page + 1 })}
                className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
