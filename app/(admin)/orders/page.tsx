import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatDate } from '@/lib/utils/format-date'
import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import type { Order, OrderStatus } from '@/types/app.types'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const query = params.q ?? ''
  const statusFilter = params.status ?? ''
  const page = Number(params.page ?? '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let dbQuery = supabase
    .from('orders')
    .select('*, customer:customers(id, full_name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (statusFilter) {
    dbQuery = dbQuery.eq('status', statusFilter)
  }
  if (query) {
    dbQuery = dbQuery.textSearch('search_vector', query, { type: 'plain' })
  }

  const { data: orders, count } = await dbQuery
  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total</p>
        </div>
        <Link
          href="/orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form method="GET" className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search orders, customers…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        </form>

        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/orders${query ? `?q=${query}` : ''}`}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              !statusFilter ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All
          </Link>
          {ORDER_STATUSES.map(s => (
            <Link
              key={s.value}
              href={`/orders?status=${s.value}${query ? `&q=${query}` : ''}`}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {!orders || orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm">No orders found.</p>
            <Link href="/orders/new" className="mt-3 inline-flex text-blue-600 text-sm font-medium hover:text-blue-700">
              Create first order →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Items</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Delivery</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(orders as (Order & { customer: { full_name: string; phone: string } | null })[]).map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{order.customer?.full_name ?? '—'}</p>
                    <p className="text-xs text-slate-500">{order.customer?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{order.total_items}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {order.delivery_date ? formatDate(order.delivery_date) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs"
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
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/orders?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}${query ? `&q=${query}` : ''}`}
                className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/orders?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}${query ? `&q=${query}` : ''}`}
                className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
