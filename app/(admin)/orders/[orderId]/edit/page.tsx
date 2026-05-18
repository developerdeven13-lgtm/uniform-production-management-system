import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { EditOrderForm } from '@/components/orders/EditOrderForm'

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  await requirePermission('orders.update')
  const supabase = await createClient()

  const { orderId } = await params

  const [orderRes, itemsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', orderId).single(),
    supabase.from('order_items').select('*').eq('order_id', orderId).order('sequence_number'),
  ])

  if (!orderRes.data || orderRes.error) notFound()

  const order = orderRes.data
  const items = itemsRes.data ?? []

  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/orders" className="hover:text-slate-700">Orders</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/orders/${orderId}`} className="hover:text-slate-700 font-mono font-semibold text-slate-900">
          {order.order_number}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span>Edit</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Order</h1>
        <p className="text-sm text-slate-500 mt-0.5">Update order details and items for {order.order_number}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <EditOrderForm order={order} items={items} />
      </div>
    </div>
  )
}
