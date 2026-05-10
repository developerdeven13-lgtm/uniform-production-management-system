import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatDateTime } from '@/lib/utils/format-date'
import type { OrderStatus } from '@/types/app.types'

export default async function OrderTimelinePage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  await requireUser()
  const supabase = await createClient()

  const { orderId } = await params

  const [orderResult, historyResult] = await Promise.all([
    supabase.from('orders').select('id, order_number, status').eq('id', orderId).single(),
    supabase
      .from('order_status_history')
      .select('*, changer:profiles!order_status_history_changed_by_fkey(full_name, role)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }),
  ])

  if (!orderResult.data) notFound()
  const order = orderResult.data
  const history = historyResult.data ?? []

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/orders" className="hover:text-slate-700">Orders</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/orders/${orderId}`} className="hover:text-slate-700 font-mono">
          {order.order_number}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Timeline</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Order Timeline</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-mono">{order.order_number}</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
          <p className="text-slate-500 text-sm">No status changes recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200" />
            <div className="space-y-6">
              {history.map((entry, i) => (
                <div key={entry.id} className="flex gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-blue-400 flex items-center justify-center shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.from_status && (
                        <>
                          <OrderStatusBadge status={entry.from_status as OrderStatus} />
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </>
                      )}
                      <OrderStatusBadge status={entry.to_status as OrderStatus} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      by{' '}
                      <span className="font-medium text-slate-700">
                        {(entry as { changer?: { full_name: string } }).changer?.full_name ?? 'System'}
                      </span>
                      {' · '}
                      {formatDateTime(entry.created_at)}
                    </p>
                    {entry.reason && (
                      <p className="text-sm text-slate-600 mt-1 bg-slate-50 rounded-lg px-3 py-2">
                        &ldquo;{entry.reason}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
