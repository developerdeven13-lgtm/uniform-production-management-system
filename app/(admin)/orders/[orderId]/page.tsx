import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, Cpu, Pencil, Ruler, Clock, Paperclip,
  MessageSquare, Calendar, AlertTriangle, Package,
  CheckCircle, Phone, Building2, Scissors, Flag,
} from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper'
import { OrderStatusActions } from '@/components/orders/OrderStatusActions'
import { MediaSection } from '@/components/media/MediaSection'
import { RaiseFlagModal } from '@/components/flags/RaiseFlagModal'
import { FlagList } from '@/components/flags/FlagList'
import { getOrderMedia } from '@/actions/media'
import { getOrderFlags } from '@/actions/flags'
import { formatDate, formatDateTime } from '@/lib/utils/format-date'
import { PRODUCT_LABEL } from '@/lib/constants/products'
import { STATUS_LABEL } from '@/lib/constants/order-statuses'
import { can } from '@/lib/permissions/can'
import type { OrderStatus } from '@/types/app.types'

/* ── Status pill colors designed for the dark #0f2416 hero background ── */
const HERO_PILL: Record<string, { bg: string; color: string }> = {
  draft:         { bg: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.8)' },
  confirmed:     { bg: '#85B7EB', color: '#042C53' },
  assigned:      { bg: '#C4BFEE', color: '#26215C' },
  in_tailoring:  { bg: '#FAC775', color: '#3D2202' },
  in_embroidery: { bg: '#C4BFEE', color: '#26215C' },
  quality_check: { bg: '#FAC775', color: '#3D2202' },
  ready:         { bg: '#5DCAA5', color: '#04342C' },
  delivered:     { bg: '#97C459', color: '#173404' },
  cancelled:     { bg: '#F09595', color: '#4F1111' },
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const MEASUREMENT_SKIP = new Set([
  'id', 'order_item_id', 'customer_id', 'product_type',
  'custom_measurements', 'notes', 'measured_by', 'measured_at',
  'created_at', 'updated_at', 'prefilled_from_profile',
])

/* ── Shared tokens ──────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: '#ffffff',
  border: '0.5px solid #D3D1C7',
  borderRadius: 16,
  overflow: 'hidden',
}

const microLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#9B9A92',
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const user = await requirePermission('orders.read.all')
  const supabase = await createClient()
  const { orderId } = await params

  const orderRes = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (!orderRes.data || orderRes.error) notFound()

  const order = orderRes.data
  const userRole = user.role

  const [customerRes, itemsRes, creatorRes, mediaResult, flagsResult] = await Promise.all([
    supabase.from('customers').select('*').eq('id', order.customer_id).single(),
    supabase.from('order_items').select('*').eq('order_id', orderId).order('sequence_number'),
    supabase.from('profiles').select('full_name').eq('id', order.created_by).single(),
    getOrderMedia(orderId),
    getOrderFlags(orderId),
  ])

  const customer = customerRes.data
  const items = itemsRes.data ?? []
  const creator = creatorRes.data
  const initialMedia = mediaResult.success ? mediaResult.data : []
  const flags = flagsResult.success ? flagsResult.data : []
  const openFlagCount = flags.filter(f => f.status !== 'resolved').length

  const canUpload = userRole
    ? ['super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor'].includes(userRole)
    : false
  const canDelete = userRole ? ['super_admin', 'admin'].includes(userRole) : false
  const canRaiseFlag = userRole ? can(userRole, 'flags.raise') : false
  const canResolveFlag = userRole ? can(userRole, 'flags.resolve') : false

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

  const heroPill = HERO_PILL[order.status] ?? HERO_PILL.draft

  return (
    <div className="max-w-7xl" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(140deg, #14321e 0%, #0f2416 55%, #0c1e11 100%)',
        borderRadius: 18,
        padding: '22px 26px 24px',
        boxShadow: '0 4px 24px rgba(15,36,22,0.2), 0 1px 3px rgba(0,0,0,0.1)',
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Link href="/orders" style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 500 }}>
            Orders
          </Link>
          <ChevronRight style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.22)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 500 }}>
            {order.order_number}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            {/* Order number */}
            <div style={{
              fontSize: 'clamp(30px, 5vw, 52px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              lineHeight: 1,
              marginBottom: 16,
              overflowWrap: 'break-word',
            }}>
              {order.order_number}
            </div>

            {/* Status pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: heroPill.bg, color: heroPill.color, letterSpacing: '0.02em' }}>
                {STATUS_LABEL[order.status as OrderStatus] ?? order.status}
              </span>
              {order.priority === 1 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#F09595', color: '#4F1111' }}>
                  <AlertTriangle style={{ width: 11, height: 11 }} /> Urgent
                </span>
              )}
              {order.ai_intake_used && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#C4BFEE', color: '#26215C' }}>
                  <Cpu style={{ width: 11, height: 11 }} /> AI Intake
                </span>
              )}
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.36)', marginTop: 12, lineHeight: 1.5 }}>
              Created {formatDateTime(order.created_at)}
              {creator && (
                <span> · by <span style={{ color: 'rgba(255,255,255,0.58)', fontWeight: 500 }}>{creator.full_name}</span></span>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap shrink-0">
            {userRole && ['super_admin', 'admin', 'support_staff'].includes(userRole) && (
              <Link
                href={`/orders/${orderId}/edit`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.16)',
                  color: 'rgba(255,255,255,0.85)', textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                <Pencil style={{ width: 13, height: 13 }} /> Edit
              </Link>
            )}
            <Link
              href={`/orders/${orderId}/timeline`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.16)',
                color: 'rgba(255,255,255,0.85)', textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Timeline
            </Link>
          </div>
        </div>
      </div>

      {/* ── Status stepper ───────────────────────────────────────────────── */}
      <div style={{ ...card, padding: '20px 22px' }}>
        <div style={{ ...microLabel, marginBottom: 18 }}>Production Status</div>
        <OrderStatusStepper currentStatus={order.status as OrderStatus} />
        {userRole && (
          <div style={{ paddingTop: 16, marginTop: 16, borderTop: '0.5px solid #F1EFE8' }}>
            <OrderStatusActions
              order={{ id: order.id, status: order.status as OrderStatus }}
              userRole={userRole}
            />
          </div>
        )}
      </div>

      {/* ── Special instructions ─────────────────────────────────────────── */}
      {order.special_instructions && (
        <div style={{
          background: '#FFFDF6',
          borderLeft: '3px solid #EF9F27',
          borderTop: '0.5px solid #FAD280',
          borderRight: '0.5px solid #FAD280',
          borderBottom: '0.5px solid #FAD280',
          borderRadius: '2px 12px 12px 2px',
          padding: '14px 18px',
          display: 'flex', gap: 12,
        }}>
          <MessageSquare style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2, color: '#9A5A0B' }} />
          <div>
            <p style={{ ...microLabel, color: '#9A5A0B', marginBottom: 5 }}>Special Instructions</p>
            <p style={{ fontSize: 13, color: '#633806', lineHeight: 1.65 }}>{order.special_instructions}</p>
          </div>
        </div>
      )}

      {/* ── Customer + Order details ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Customer */}
        <div style={{ ...card, padding: '20px 22px' }}>
          <div style={{ ...microLabel, marginBottom: 14 }}>Customer</div>
          {customer ? (
            <>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, #E1F5EE 0%, #C8EDE0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#085041',
                marginBottom: 12, letterSpacing: '-0.02em', flexShrink: 0,
              }}>
                {getInitials(customer.full_name)}
              </div>
              <Link
                href={`/customers/${customer.id}`}
                style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f2416', textDecoration: 'none', lineHeight: 1.15, display: 'block' }}
              >
                {customer.full_name}
              </Link>
              {customer.phone && (
                <p style={{ fontSize: 13, color: '#5F5E5A', marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone style={{ width: 13, height: 13, color: '#B4B2A9', flexShrink: 0 }} />
                  {customer.phone}
                </p>
              )}
              {customer.organization && (
                <p style={{ fontSize: 12, color: '#888780', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 style={{ width: 12, height: 12, color: '#C4C2B9', flexShrink: 0 }} />
                  {customer.organization}
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#9B9A92' }}>Customer not found</p>
          )}
        </div>

        {/* Order details */}
        <div style={{ ...card, padding: '20px 22px' }}>
          <div style={{ ...microLabel, marginBottom: 14 }}>Order Details</div>
          <div>
            {[
              {
                icon: <Calendar style={{ width: 14, height: 14, color: '#B4B2A9', flexShrink: 0 }} />,
                label: 'Delivery',
                value: order.delivery_date ? formatDate(order.delivery_date) : '—',
              },
              {
                icon: <AlertTriangle style={{ width: 14, height: 14, color: '#B4B2A9', flexShrink: 0 }} />,
                label: 'Priority',
                value: order.priority === 1 ? 'Urgent' : order.priority === 2 ? 'Normal' : 'Low',
                valueStyle: order.priority === 1 ? { color: '#A32D2D', fontWeight: 700 } as React.CSSProperties : undefined,
              },
              {
                icon: <Package style={{ width: 14, height: 14, color: '#B4B2A9', flexShrink: 0 }} />,
                label: 'Items',
                value: `${order.total_items} item${order.total_items !== 1 ? 's' : ''}`,
              },
              ...(order.confirmed_at ? [{
                icon: <CheckCircle style={{ width: 14, height: 14, color: '#B4B2A9', flexShrink: 0 }} />,
                label: 'Confirmed',
                value: formatDate(order.confirmed_at),
                valueStyle: undefined,
              }] : []),
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 0',
                  borderBottom: i < arr.length - 1 ? '0.5px solid #F1EFE8' : 'none',
                }}
              >
                <span style={{ fontSize: 12, color: '#9B9A92', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {row.icon} {row.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A', ...row.valueStyle }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Media ────────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 22px', borderBottom: '0.5px solid #F1EFE8',
        }}>
          <Paperclip style={{ width: 14, height: 14, color: '#9B9A92' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A' }}>Media &amp; References</span>
          {initialMedia.length > 0 && (
            <span style={{ fontSize: 12, color: '#9B9A92', fontWeight: 400 }}>
              · {initialMedia.length} file{initialMedia.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ padding: '16px 22px' }}>
          <MediaSection
            orderId={orderId}
            initialMedia={initialMedia}
            canUpload={canUpload}
            canDelete={canDelete}
          />
        </div>
      </div>

      {/* ── Flags ────────────────────────────────────────────────────────── */}
      {(canRaiseFlag || flags.length > 0) && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '14px 22px', borderBottom: '0.5px solid #F1EFE8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flag style={{ width: 14, height: 14, color: openFlagCount > 0 ? '#791F1F' : '#9B9A92' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A' }}>
                Flags &amp; Issues
              </span>
              {openFlagCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#FCEBEB', color: '#791F1F', border: '0.5px solid #F7C1C1' }}>
                  {openFlagCount} open
                </span>
              )}
            </div>
            {canRaiseFlag && (
              <RaiseFlagModal
                orderId={orderId}
                orderNumber={order.order_number}
              />
            )}
          </div>
          <div style={{ padding: '16px 22px' }}>
            <FlagList flags={flags} canResolve={canResolveFlag} />
          </div>
        </div>
      )}

      {/* ── Items ────────────────────────────────────────────────────────── */}
      <div>
        <p style={{ ...microLabel, marginBottom: 12 }}>Items ({items.length})</p>

        {items.length === 0 && (
          <div style={{ ...card, padding: '44px 24px', textAlign: 'center', fontSize: 13, color: '#9B9A92' }}>
            No items on this order.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, idx) => {
            const assignment = assignmentsMap[item.id]
            const measurement = measurementsMap[item.id]
            const measEntries = measurement
              ? Object.entries(measurement).filter(
                  ([k, v]) => !MEASUREMENT_SKIP.has(k) && v !== null && v !== ''
                )
              : []

            return (
              <div key={item.id} style={card}>
                {/* Item header */}
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <Scissors style={{ width: 11, height: 11, color: '#B4B2A9' }} />
                      <span style={{ ...microLabel, color: '#B4B2A9' }}>
                        Item {idx + 1} of {items.length}
                      </span>
                    </div>
                    <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#1A2E22', lineHeight: 1.1 }}>
                      {PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL] ?? item.product_type}
                      {' '}&times; {item.quantity}
                    </p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                      {item.gender && item.gender !== 'unisex' && (
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: item.gender === 'female' ? '#FAEEDA' : '#E6F1FB', color: item.gender === 'female' ? '#7A4608' : '#0C447C' }}>
                          {item.gender === 'female' ? 'Female' : 'Male'}
                        </span>
                      )}
                      {item.color && (
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: '#F1EFE8', color: '#444441' }}>
                          {item.color}
                        </span>
                      )}
                      {item.piping_color && (
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: '#F1EFE8', color: '#444441' }}>
                          Piping: {item.piping_color}
                        </span>
                      )}
                      {item.has_embroidery && (
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: '#EEEDFE', color: '#3C3489' }}>
                          Embroidery{item.embroidery_name ? `: ${item.embroidery_name}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <OrderStatusBadge status={item.status as OrderStatus} />
                </div>

                {/* Measurements — embedded in item card */}
                {measEntries.length > 0 && (
                  <>
                    <div style={{
                      padding: '10px 20px',
                      borderTop: '0.5px solid #F1EFE8',
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: '#FAFAF8',
                    }}>
                      <Ruler style={{ width: 12, height: 12, color: '#C4C2B9' }} />
                      <span style={{ ...microLabel, color: '#C4C2B9' }}>Measurements</span>
                      {measurement?.notes && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9B9A92', fontStyle: 'italic' }}>
                          {measurement.notes}
                        </span>
                      )}
                    </div>
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
                        background: '#D3D1C7',
                        gap: '0.5px',
                      }}
                    >
                      {measEntries.map(([k, v]) => (
                        <div key={k} style={{ textAlign: 'center', padding: '14px 6px', background: '#F7F5EE' }}>
                          <p style={{ fontSize: 9, color: '#9B9A92', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                            {k.replace(/_/g, ' ')}
                          </p>
                          <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: '#0f2416', lineHeight: 1 }}>
                            {String(v)}
                          </p>
                          <p style={{ fontSize: 9, color: '#B4B2A9', marginTop: 3, letterSpacing: '0.04em' }}>cm</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Item special instructions */}
                {item.special_instructions && (
                  <div style={{
                    padding: '10px 20px',
                    borderTop: '0.5px solid #F1EFE8',
                    fontSize: 13, color: '#7A4608',
                    background: '#FFFDF6',
                    lineHeight: 1.6,
                  }}>
                    {item.special_instructions}
                  </div>
                )}

                {/* Tailor assignment footer */}
                {assignment && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 20px',
                    borderTop: '0.5px solid #F1EFE8',
                    background: '#FAFAF8',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D4F0E4 0%, #BEE8D4 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#085041', flexShrink: 0,
                    }}>
                      {getInitials((assignment as { tailor?: { full_name: string } }).tailor?.full_name ?? '?')}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A', lineHeight: 1.2 }}>
                        {(assignment as { tailor?: { full_name: string } }).tailor?.full_name ?? 'Unknown'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9B9A92' }}>Tailor</div>
                    </div>
                    {assignment.estimated_hours && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9B9A92', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <Clock style={{ width: 12, height: 12 }} /> {assignment.estimated_hours}h estimated
                      </span>
                    )}
                    {canRaiseFlag && (
                      <div style={{ marginLeft: assignment.estimated_hours ? 0 : 'auto' }}>
                        <RaiseFlagModal
                          orderId={orderId}
                          orderItemId={item.id}
                          orderNumber={order.order_number}
                          itemLabel={`Item ${idx + 1}`}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
