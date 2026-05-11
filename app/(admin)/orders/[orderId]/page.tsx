import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, Calendar, User, Package,
  Ruler, MessageSquare, Cpu, AlertTriangle, Clock, Paperclip, Pencil,
} from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper'
import { OrderStatusActions } from '@/components/orders/OrderStatusActions'
import { MediaSection } from '@/components/media/MediaSection'
import { getOrderMedia } from '@/actions/media'
import { formatDate, formatDateTime } from '@/lib/utils/format-date'
import { PRODUCT_LABEL } from '@/lib/constants/products'
import type { OrderStatus, UserRole } from '@/types/app.types'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const user = await requireUser()
  const supabase = await createClient()

  const { orderId } = await params

  const orderRes = await supabase.from('orders').select('*').eq('id', orderId).single()

  if (!orderRes.data || orderRes.error) notFound()

  const order = orderRes.data
  const userRole = user.role

  // Fetch related data separately
  const [customerRes, itemsRes, creatorRes, mediaResult] = await Promise.all([
    supabase.from('customers').select('*').eq('id', order.customer_id).single(),
    supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('sequence_number'),
    supabase.from('profiles').select('full_name').eq('id', order.created_by).single(),
    getOrderMedia(orderId),
  ])

  const customer = customerRes.data
  const items = itemsRes.data ?? []
  const creator = creatorRes.data
  const initialMedia = mediaResult.success ? mediaResult.data : []

  // Determine upload/delete permissions
  const canUpload = userRole
    ? ['super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor'].includes(userRole)
    : false
  const canDelete = userRole
    ? ['super_admin', 'admin'].includes(userRole)
    : false

  // Fetch measurements and assignments for each item
  const [measurementsRes, assignmentsRes] = await Promise.all([
    supabase
      .from('order_measurements')
      .select('*')
      .in('order_item_id', items.map(i => i.id)),
    supabase
      .from('tailor_assignments')
      .select('*, tailor:profiles(id, full_name)')
      .in('order_item_id', items.map(i => i.id))
      .eq('is_active', true),
  ])

  const measurementsMap = Object.fromEntries(
    (measurementsRes.data ?? []).map(m => [m.order_item_id, m])
  )
  const assignmentsMap = Object.fromEntries(
    (assignmentsRes.data ?? []).map(a => [a.order_item_id, a])
  )

  const MEASUREMENT_SKIP = new Set([
    'id', 'order_item_id', 'customer_id', 'product_type',
    'custom_measurements', 'notes', 'measured_by', 'measured_at',
    'created_at', 'updated_at', 'prefilled_from_profile',
  ])

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/orders" className="hover:text-slate-700">Orders</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-mono font-semibold text-slate-900">{order.order_number}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{order.order_number}</h1>
            <OrderStatusBadge status={order.status as OrderStatus} />
            {order.ai_intake_used && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                <Cpu className="w-3 h-3" /> AI Intake
              </span>
            )}
            {order.priority === 1 && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Urgent
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Created {formatDateTime(order.created_at)}
            {creator && <span> by <span className="font-medium">{creator.full_name}</span></span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole && ['super_admin', 'admin', 'support_staff'].includes(userRole) && (
            <Link
              href={`/orders/${orderId}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}
          <Link
            href={`/orders/${orderId}/timeline`}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            View Timeline
          </Link>
        </div>
      </div>

      {/* Status stepper + actions — the most important section */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-500">
          Production Status
        </h2>
        <OrderStatusStepper currentStatus={order.status as OrderStatus} />

        {userRole && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Available actions for your role ({userRole.replace(/_/g, ' ')}):</p>
            <OrderStatusActions
              order={{ id: order.id, status: order.status as OrderStatus }}
              userRole={userRole}
            />
          </div>
        )}
      </div>

      {/* Customer + order meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" /> Customer
          </h2>
          {customer ? (
            <>
              <Link
                href={`/customers/${customer.id}`}
                className="font-semibold text-blue-600 hover:text-blue-800 text-sm"
              >
                {customer.full_name}
              </Link>
              <p className="text-sm text-slate-600 mt-0.5">{customer.phone}</p>
              {customer.organization && (
                <p className="text-sm text-slate-500">{customer.organization}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">Customer not found</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" /> Order Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Date</span>
              <span className="font-medium text-slate-900">
                {order.delivery_date ? formatDate(order.delivery_date) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority</span>
              <span className="font-medium text-slate-900">
                {order.priority === 1 ? '🔴 Urgent' : order.priority === 2 ? '🟡 Normal' : '🟢 Low'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Items</span>
              <span className="font-medium text-slate-900">{order.total_items}</span>
            </div>
            {order.confirmed_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">Confirmed</span>
                <span className="font-medium text-slate-900">{formatDate(order.confirmed_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Special instructions */}
      {order.special_instructions && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900 mb-0.5">Special Instructions</p>
            <p className="text-sm text-amber-800">{order.special_instructions}</p>
          </div>
        </div>
      )}

      {/* Media & References — shown before items so tailors see voice notes and images first */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-400" />
          Media &amp; References
          {initialMedia.length > 0 && (
            <span className="text-xs font-normal text-slate-400 ml-1">
              ({initialMedia.length} file{initialMedia.length !== 1 ? 's' : ''})
            </span>
          )}
        </h2>
        <MediaSection
          orderId={orderId}
          initialMedia={initialMedia}
          canUpload={canUpload}
          canDelete={canDelete}
        />
      </div>

      {/* Order items */}
      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          Items ({items.length})
        </h2>

        {items.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 py-10 text-center text-sm text-slate-400">
            No items on this order.
          </div>
        )}

        {items.map((item, i) => {
          const measurement = measurementsMap[item.id]
          const assignment = assignmentsMap[item.id]

          return (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Item header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL] ?? item.product_type}
                      {' '}&times; {item.quantity}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs">
                      {item.gender && item.gender !== 'unisex' && (
                        <span className={`px-1.5 py-0.5 rounded font-medium ${item.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.gender === 'female' ? 'Female' : 'Male'}
                        </span>
                      )}
                      {item.color && <span className="text-slate-500">Color: <span className="font-medium text-slate-700">{item.color}</span></span>}
                      {item.piping_color && <span className="text-slate-500">Piping: <span className="font-medium text-slate-700">{item.piping_color}</span></span>}
                      {item.has_embroidery && (
                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                          Embroidery{item.embroidery_name ? `: ${item.embroidery_name}` : ''}
                        </span>
                      )}
                      {item.unit_price && (
                        <span className="text-slate-500">₹{item.unit_price}</span>
                      )}
                    </div>
                  </div>
                </div>
                <OrderStatusBadge status={item.status as OrderStatus} />
              </div>

              {/* Measurements */}
              {measurement && (
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" /> Measurements (cm)
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {Object.entries(measurement)
                      .filter(([k, v]) => !MEASUREMENT_SKIP.has(k) && v !== null && v !== '')
                      .map(([k, v]) => (
                        <div key={k} className="text-center">
                          <p className="text-[10px] text-slate-400 capitalize mb-0.5">
                            {k.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm font-bold text-slate-800">{String(v)}</p>
                        </div>
                      ))}
                  </div>
                  {measurement.notes && (
                    <p className="text-xs text-slate-500 mt-2">{measurement.notes}</p>
                  )}
                </div>
              )}

              {/* Assignment */}
              {assignment && (
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Assigned to</span>
                  <span className="font-semibold text-slate-800">
                    {(assignment as { tailor?: { full_name: string } }).tailor?.full_name ?? 'Unknown'}
                  </span>
                  {assignment.estimated_hours && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {assignment.estimated_hours}h est.
                    </span>
                  )}
                </div>
              )}

              {/* Special instructions */}
              {item.special_instructions && (
                <div className="px-5 py-3 text-sm text-slate-600 bg-amber-50/50">
                  {item.special_instructions}
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
