import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import Link from 'next/link'
import { ClipboardList, Users, Clock, CheckCircle, ArrowUpRight, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  await requireUser()
  const supabase = await createClient()

  const [ordersResult, customersResult] = await Promise.all([
    supabase.from('orders').select('status, priority', { count: 'exact' }),
    supabase.from('customers').select('id', { count: 'exact' }),
  ])

  const totalOrders = ordersResult.count ?? 0
  const totalCustomers = customersResult.count ?? 0

  const orders = ordersResult.data ?? []
  const inProgress = orders.filter(o =>
    ['assigned', 'in_tailoring', 'in_embroidery', 'quality_check'].includes(o.status)
  ).length
  const completed = orders.filter(o => o.status === 'delivered').length
  const urgentCount = orders.filter(o => o.priority === 1).length

  const STATUS_ROWS = [
    { status: 'draft', label: 'Draft', color: '#94a3b8' },
    { status: 'confirmed', label: 'Confirmed', color: '#60a5fa' },
    { status: 'assigned', label: 'Assigned', color: '#a78bfa' },
    { status: 'in_tailoring', label: 'In Tailoring', color: '#fbbf24' },
    { status: 'in_embroidery', label: 'In Embroidery', color: '#fb923c' },
    { status: 'quality_check', label: 'Quality Check', color: '#f472b6' },
    { status: 'ready', label: 'Ready', color: '#34d399' },
    { status: 'delivered', label: 'Delivered', color: '#10b981' },
    { status: 'cancelled', label: 'Cancelled', color: '#f87171' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Plan, prioritize, and track your production with ease.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/orders/new"
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl shadow-sm transition-opacity hover:opacity-90"
            style={{ background: '#0f2e1e' }}
          >
            + New Order
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            View All Orders
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders – hero card */}
        <Link
          href="/orders"
          className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group transition-opacity hover:opacity-95"
          style={{ background: '#0f2e1e' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Orders</p>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)' }}>
              <ArrowUpRight className="w-4 h-4" style={{ color: '#34d399' }} />
            </div>
          </div>
          <p className="text-4xl font-bold text-white">{totalOrders}</p>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#34d399' }}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span>All time production orders</span>
          </div>
        </Link>

        {/* Total Customers */}
        <Link
          href="/customers"
          className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Customers</p>
            <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-purple-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">{totalCustomers}</p>
          <div className="flex items-center gap-1.5 text-xs text-purple-500">
            <Users className="w-3.5 h-3.5" />
            <span>Registered customers</span>
          </div>
        </Link>

        {/* In Production */}
        <Link
          href="/orders?status=in_tailoring"
          className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">In Production</p>
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">{inProgress}</p>
          <div className="flex items-center gap-1.5 text-xs text-amber-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Active in workflow</span>
          </div>
        </Link>

        {/* Delivered */}
        <Link
          href="/orders?status=delivered"
          className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Delivered</p>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <p className="text-4xl font-bold text-slate-900">{completed}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Orders completed</span>
          </div>
        </Link>
      </div>

      {/* Bottom row: status breakdown + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-slate-900">Production Analytics</h2>
            <Link href="/orders" className="text-xs font-medium hover:underline" style={{ color: '#0f2e1e' }}>
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {STATUS_ROWS.map(({ status, label, color }) => {
              const count = orders.filter(o => o.status === status).length
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick stats panel */}
        <div className="flex flex-col gap-4">
          {/* Urgent orders alert */}
          <Link
            href="/orders?priority=urgent"
            className="bg-white rounded-2xl border p-5 flex flex-col gap-2 hover:shadow-md transition-all group"
            style={{ borderColor: urgentCount > 0 ? '#fca5a5' : '#e2e8f0' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Urgent Orders</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#fee2e2', color: '#dc2626' }}>
                Priority
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: urgentCount > 0 ? '#dc2626' : '#1e293b' }}>
              {urgentCount}
            </p>
            <p className="text-xs text-slate-400">
              {urgentCount > 0 ? 'Require immediate attention' : 'No urgent orders right now'}
            </p>
          </Link>

          {/* Completion rate */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-500">Completion Rate</p>
            <p className="text-3xl font-bold text-slate-900">
              {totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0}%
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0}%`,
                  background: '#10b981',
                }}
              />
            </div>
            <p className="text-xs text-slate-400">{completed} of {totalOrders} orders delivered</p>
          </div>
        </div>
      </div>
    </div>
  )
}
