import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClipboardList, Users, Clock, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [ordersResult, customersResult] = await Promise.all([
    supabase.from('orders').select('status', { count: 'exact' }),
    supabase.from('customers').select('id', { count: 'exact' }),
  ])

  const totalOrders = ordersResult.count ?? 0
  const totalCustomers = customersResult.count ?? 0

  const orders = ordersResult.data ?? []
  const inProgress = orders.filter(o =>
    ['assigned', 'in_tailoring', 'in_embroidery', 'quality_check'].includes(o.status)
  ).length
  const completed = orders.filter(o => o.status === 'delivered').length

  const kpis = [
    { label: 'Total Orders', value: totalOrders, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Customers', value: totalCustomers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'In Production', value: inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Delivered', value: completed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Production overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">{kpi.label}</p>
              <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Order Status Breakdown</h2>
        <div className="space-y-2">
          {[
            { status: 'draft', label: 'Draft', color: 'bg-slate-400' },
            { status: 'confirmed', label: 'Confirmed', color: 'bg-blue-400' },
            { status: 'assigned', label: 'Assigned', color: 'bg-purple-400' },
            { status: 'in_tailoring', label: 'In Tailoring', color: 'bg-yellow-400' },
            { status: 'in_embroidery', label: 'In Embroidery', color: 'bg-orange-400' },
            { status: 'quality_check', label: 'Quality Check', color: 'bg-pink-400' },
            { status: 'ready', label: 'Ready', color: 'bg-green-400' },
            { status: 'delivered', label: 'Delivered', color: 'bg-emerald-500' },
            { status: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
          ].map(({ status, label, color }) => {
            const count = orders.filter(o => o.status === status).length
            const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-700 w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
