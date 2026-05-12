import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Cpu, Pencil, Ruler, User, Clock, Paperclip, MessageSquare } from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper'
import { OrderStatusActions } from '@/components/orders/OrderStatusActions'
import { MediaSection } from '@/components/media/MediaSection'
import { getOrderMedia } from '@/actions/media'
import { formatDate, formatDateTime } from '@/lib/utils/format-date'
import { PRODUCT_LABEL } from '@/lib/constants/products'
import type { OrderStatus, UserRole } from '@/types/app.types'

const card: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid #D3D1C7',
  borderRadius: 14,
  overflow: 'hidden',
}
const cardPad: React.CSSProperties = { padding: '18px 20px' }
const sectionLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#888780',
  marginBottom: 10,
}
const detailRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '0.5px solid #F1EFE8',
}

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

  const [customerRes, itemsRes, creatorRes, mediaResult] = await Promise.all([
    supabase.from('customers').select('*').eq('id', order.customer_id).single(),
    supabase.from('order_items').select('*').eq('order_id', orderId).order('sequence_number'),
    supabase.from('profiles').select('full_name').eq('id', order.created_by).single(),
    getOrderMedia(orderId),
  ])

  const customer = customerRes.data
  const items = itemsRes.data ?? []
  const creator = creatorRes.data
  const initialMedia = mediaResult.success ? mediaResult.data : []

  const canUpload = userRole
    ? ['super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor'].includes(userRole)
    : false
  const canDelete = userRole ? ['super_admin', 'admin'].includes(userRole) : false

  const [measurementsRes, assignmentsRes] = await Promise.all([
    supabase.from('order_measurements').select('*').in('order_item_id', items.map(i => i.id)),
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
    <div className="max-w-4xl" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <Link href="/orders" style={{ color: '#888780', textDecoration: 'none' }}>Orders</Link>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: '#2C2C2A', fontWeight: 500 }}>{order.order_number}</span>
      </nav>

      {/* Hero header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-2.5px', color: '#0f2416', lineHeight: 0.95, fontFamily: 'monospace' }}>
              {order.order_number}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 5, gap: 5 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <OrderStatusBadge status={order.status as OrderStatus} />
                {order.priority === 1 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 500, background: '#2C2C2A', color: '#F1EFE8' }}>
                    Urgent
                  </span>
                )}
                {order.ai_intake_used && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 500, background: '#EEEDFE', color: '#3C3489' }}>
                    <Cpu className="w-2.5 h-2.5" /> AI Intake
                  </span>
                )}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#888780', marginTop: 8 }}>
            Created {formatDateTime(order.created_at)}
            {creator && <span> · by <span style={{ fontWeight: 500, color: '#5F5E5A' }}>{creator.full_name}</span></span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          {userRole && ['super_admin', 'admin', 'support_staff'].includes(userRole) && (
            <Link
              href={`/orders/${orderId}/edit`}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 500, background: '#fff', border: '0.5px solid #D3D1C7', color: '#2C2C2A', textDecoration: 'none' }}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
          )}
          <Link
            href={`/orders/${orderId}/timeline`}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 500, background: '#fff', border: '0.5px solid #D3D1C7', color: '#2C2C2A', textDecoration: 'none' }}
          >
            Timeline
          </Link>
        </div>
      </div>

      {/* Status stepper */}
      <div style={{ ...card, ...cardPad }}>
        <div style={sectionLabel}>Production Status</div>
        <OrderStatusStepper currentStatus={order.status as OrderStatus} />
        {userRole && (
          <div style={{ paddingTop: 14, marginTop: 14, borderTop: '0.5px solid #F1EFE8' }}>
            <OrderStatusActions
              order={{ id: order.id, status: order.status as OrderStatus }}
              userRole={userRole}
            />
          </div>
        )}
      </div>

      {/* Special instructions */}
      {order.special_instructions && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
          <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#854F0B' }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#854F0B', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Special Instructions</p>
            <p style={{ fontSize: 12, color: '#633806', lineHeight: 1.5 }}>{order.special_instructions}</p>
          </div>
        </div>
      )}

      {/* Customer + order details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ ...card, ...cardPad }}>
          <div style={sectionLabel}>Customer</div>
          {customer ? (
            <>
              <Link
                href={`/customers/${customer.id}`}
                style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: '#0f2416', textDecoration: 'none', lineHeight: 1.1 }}
              >
                {customer.full_name}
              </Link>
              <p style={{ fontSize: 12, color: '#5F5E5A', marginTop: 4 }}>{customer.phone}</p>
              {customer.organization && (
                <p style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{customer.organization}</p>
              )}
            </>
          ) : (
            <p style={{ fontSize: 12, color: '#888780' }}>Customer not found</p>
          )}
        </div>

        <div style={{ ...card, ...cardPad }}>
          <div style={sectionLabel}>Order Details</div>
          <div>
            {[
              { label: 'Delivery date', value: order.delivery_date ? formatDate(order.delivery_date) : '—' },
              {
                label: 'Priority',
                value: order.priority === 1 ? 'Urgent' : order.priority === 2 ? 'Normal' : 'Low',
                style: order.priority === 1 ? { color: '#A32D2D' } : undefined,
              },
              { label: 'Total items', value: String(order.total_items) },
              ...(order.confirmed_at ? [{ label: 'Confirmed at', value: formatDate(order.confirmed_at) }] : []),
            ].map((row, i, arr) => (
              <div key={row.label} style={{ ...detailRow, ...(i === arr.length - 1 ? { borderBottom: 'none', paddingBottom: 0 } : {}) }}>
                <span style={{ fontSize: 11, color: '#888780' }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#2C2C2A', ...row.style }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Media */}
      <div style={{ ...card, ...cardPad }}>
        <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Paperclip className="w-3.5 h-3.5" />
          Media &amp; References
          {initialMedia.length > 0 && (
            <span style={{ color: '#888780', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>
              ({initialMedia.length} file{initialMedia.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <MediaSection
          orderId={orderId}
          initialMedia={initialMedia}
          canUpload={canUpload}
          canDelete={canDelete}
        />
      </div>

      {/* Order items */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', marginBottom: 10 }}>
          Items ({items.length})
        </p>

        {items.length === 0 && (
          <div style={{ ...card, padding: '40px 24px', textAlign: 'center', fontSize: 12, color: '#888780' }}>
            No items on this order.
          </div>
        )}

        {items.map((item, i) => {
          const measurement = measurementsMap[item.id]
          const assignment = assignmentsMap[item.id]
          const measEntries = measurement
            ? Object.entries(measurement).filter(([k, v]) => !MEASUREMENT_SKIP.has(k) && v !== null && v !== '')
            : []

          return (
            <div key={item.id} style={{ ...card, marginBottom: 10 }}>
              {/* Item header */}
              <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 10, borderBottom: '0.5px solid #F1EFE8' }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.4px', color: '#2C2C2A' }}>
                    {PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL] ?? item.product_type}
                    {' '}&times; {item.quantity}
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                    {item.gender && item.gender !== 'unisex' && (
                      <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 500, background: item.gender === 'female' ? '#FAEEDA' : '#E6F1FB', color: item.gender === 'female' ? '#633806' : '#0C447C' }}>
                        {item.gender === 'female' ? 'Female' : 'Male'}
                      </span>
                    )}
                    {item.color && (
                      <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 500, background: '#F1EFE8', color: '#444441' }}>
                        {item.color}
                      </span>
                    )}
                    {item.piping_color && (
                      <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 500, background: '#F1EFE8', color: '#444441' }}>
                        Piping: {item.piping_color}
                      </span>
                    )}
                    {item.has_embroidery && (
                      <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 500, background: '#EEEDFE', color: '#3C3489' }}>
                        Embroidery{item.embroidery_name ? `: ${item.embroidery_name}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <OrderStatusBadge status={item.status as OrderStatus} />
              </div>

              {/* Measurements */}
              {measEntries.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: '#F7F5EE', padding: '12px 18px', borderBottom: '0.5px solid #F1EFE8' }}>
                  {measEntries.map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 9, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                        {k.replace(/_/g, ' ')}
                      </p>
                      <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: '#2C2C2A' }}>{String(v)}</p>
                      <p style={{ fontSize: 9, color: '#888780' }}>cm</p>
                    </div>
                  ))}
                </div>
              )}
              {measurement?.notes && (
                <div style={{ padding: '8px 18px', background: '#F7F5EE', borderBottom: '0.5px solid #F1EFE8', fontSize: 11, color: '#888780' }}>
                  {measurement.notes}
                </div>
              )}

              {/* Assignment */}
              {assignment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderBottom: item.special_instructions ? '0.5px solid #F1EFE8' : 'none' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#085041', flexShrink: 0 }}>
                    {(assignment as { tailor?: { full_name: string } }).tailor?.full_name?.charAt(0) ?? '?'}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#2C2C2A' }}>
                    {(assignment as { tailor?: { full_name: string } }).tailor?.full_name ?? 'Unknown'}
                  </span>
                  {assignment.estimated_hours && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#888780', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock className="w-3 h-3" /> {assignment.estimated_hours}h est.
                    </span>
                  )}
                </div>
              )}

              {/* Item special instructions */}
              {item.special_instructions && (
                <div style={{ padding: '10px 18px', fontSize: 12, color: '#633806', background: '#FAEEDA50' }}>
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
