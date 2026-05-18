import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Edit, Phone, Mail, Building2, MapPin, StickyNote } from 'lucide-react'
import { formatDate } from '@/lib/utils/format-date'
import type { Customer, Order } from '@/types/app.types'
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/constants/order-statuses'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  await requirePermission('customers.read')
  const supabase = await createClient()

  const { customerId } = await params

  const [customerResult, ordersResult] = await Promise.all([
    supabase.from('customers').select('*').eq('id', customerId).single(),
    supabase
      .from('orders')
      .select('id, order_number, status, delivery_date, total_items, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!customerResult.data) notFound()
  const customer = customerResult.data as Customer
  const orders = (ordersResult.data ?? []) as Order[]

  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/customers" className="hover:text-slate-700">Customers</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">{customer.full_name}</span>
      </nav>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{customer.full_name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Added {formatDate(customer.created_at)}</p>
        </div>
        <Link
          href={`/customers/${customerId}/edit`}
          className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">Primary Phone</p>
              <p className="text-sm font-medium text-slate-900">{customer.phone}</p>
            </div>
          </div>
          {customer.phone_alt && (
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Alternate Phone</p>
                <p className="text-sm font-medium text-slate-900">{customer.phone_alt}</p>
              </div>
            </div>
          )}
          {customer.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-900">{customer.email}</p>
              </div>
            </div>
          )}
          {customer.organization && (
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Organization</p>
                <p className="text-sm font-medium text-slate-900">{customer.organization}</p>
              </div>
            </div>
          )}
          {customer.address && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Address</p>
                <p className="text-sm font-medium text-slate-900">{customer.address}</p>
              </div>
            </div>
          )}
          {customer.notes && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <StickyNote className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Notes</p>
                <p className="text-sm text-slate-700">{customer.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order history */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Order History</h2>
          <Link
            href={`/orders/new?customer_id=${customerId}`}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + New Order
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">No orders yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Order #</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden sm:table-cell">Items</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/orders/${order.id}`} className="text-blue-600 font-medium hover:text-blue-800">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 hidden sm:table-cell">{order.total_items}</td>
                  <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
