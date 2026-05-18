import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/require-permission'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Calendar, AlertTriangle, Scissors, Ruler,
  MessageSquare, Mic, Image as ImageIcon,
} from 'lucide-react'
import { PRODUCT_LABEL } from '@/lib/constants/products'
import { formatDate } from '@/lib/utils/format-date'
import { getOrderMedia } from '@/actions/media'
import { TaskActions } from '@/components/assignments/TaskActions'
import { TaskMediaViewer } from '@/components/assignments/TaskMediaViewer'

const MEASUREMENT_SKIP = new Set([
  'id', 'order_item_id', 'customer_id', 'product_type',
  'custom_measurements', 'notes', 'measured_by', 'measured_at',
  'created_at', 'updated_at', 'prefilled_from_profile',
])

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>
}) {
  await requirePermission('orders.read.own')
  const supabase = await createClient()
  const { assignmentId } = await params

  // Use the JWT-authenticated user ID so it matches Supabase RLS exactly
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: assignment, error } = await supabase
    .from('tailor_assignments')
    .select(`
      *,
      order_item:order_items(
        *,
        measurements:order_measurements(*),
        order:orders(
          id, order_number, delivery_date, priority, special_instructions,
          customer:customers(full_name, phone)
        )
      )
    `)
    .eq('id', assignmentId)
    .eq('tailor_id', user.id)
    .single()

  if (error) console.error('[task-detail] query error:', error)
  if (!assignment || !assignment.order_item) notFound()

  const item = assignment.order_item as NonNullable<typeof assignment.order_item>
  const order = item.order as NonNullable<typeof item.order>

  // getOrderMedia uses the admin storage client so signed URLs always work
  // regardless of bucket RLS — tailors assigned to this order can see its media.
  const mediaResult = await getOrderMedia(order.id)
  const allMedia = mediaResult.success ? mediaResult.data : []

  const voiceNotes = allMedia.filter(m => m.media_type === 'voice_note')
  const images = allMedia.filter(m => m.media_type === 'image')

  const measEntries = item.measurements
    ? Object.entries(item.measurements).filter(
        ([k, v]) => !MEASUREMENT_SKIP.has(k) && v !== null && v !== ''
      )
    : []

  const isStarted = Boolean(assignment.started_at)

  return (
    <div className="max-w-7xl" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Back */}
      <Link
        href="/my-tasks"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888780', textDecoration: 'none' }}
      >
        <ChevronLeft style={{ width: 14, height: 14 }} /> My Tasks
      </Link>

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(140deg, #14321e 0%, #0f2416 55%, #0c1e11 100%)',
        borderRadius: 18,
        padding: '22px 24px',
      }}>
        {/* Order number */}
        <div style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1, marginBottom: 14 }}>
          {order.order_number}
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.8)' }}>
            <Scissors style={{ width: 11, height: 11 }} />
            {PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL] ?? item.product_type} × {item.quantity}
          </span>
          {order.priority === 1 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#F09595', color: '#4F1111' }}>
              <AlertTriangle style={{ width: 11, height: 11 }} /> Urgent
            </span>
          )}
          {item.color && (
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.75)' }}>
              {item.color}
            </span>
          )}
          {item.has_embroidery && (
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#C4BFEE', color: '#26215C' }}>
              Embroidery{item.embroidery_name ? `: ${item.embroidery_name}` : ''}
            </span>
          )}
        </div>

        {/* Customer + delivery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
            {(order.customer as { full_name: string } | null)?.full_name ?? '—'}
          </p>
          {order.delivery_date && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <Calendar style={{ width: 12, height: 12 }} />
              Due {formatDate(order.delivery_date)}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <TaskActions
        orderItemId={item.id}
        isStarted={isStarted}
        orderId={order.id}
        orderNumber={order.order_number}
        itemLabel={`Item — ${PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL] ?? item.product_type}`}
      />

      {/* Reference media — voice notes + images with signed URLs */}
      {allMedia.length > 0 && (
        <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 18px', borderBottom: '0.5px solid #F1EFE8' }}>
            {voiceNotes.length > 0 && <Mic style={{ width: 14, height: 14, color: '#888780' }} />}
            {images.length > 0 && <ImageIcon style={{ width: 14, height: 14, color: '#888780' }} />}
            <span style={{ fontSize: 12, fontWeight: 600, color: '#2C2C2A' }}>Reference Media</span>
            <span style={{ fontSize: 11, color: '#888780' }}>
              {[
                voiceNotes.length > 0 && `${voiceNotes.length} voice note${voiceNotes.length !== 1 ? 's' : ''}`,
                images.length > 0 && `${images.length} image${images.length !== 1 ? 's' : ''}`,
              ].filter(Boolean).join(' · ')}
            </span>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <TaskMediaViewer voiceNotes={voiceNotes} images={images} />
          </div>
        </div>
      )}

      {/* Measurements */}
      {measEntries.length > 0 && (
        <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 18px', borderBottom: '0.5px solid #F1EFE8' }}>
            <Ruler style={{ width: 14, height: 14, color: '#888780' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#2C2C2A' }}>Measurements</span>
            <span style={{ fontSize: 11, color: '#888780' }}>cm</span>
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', background: '#D3D1C7', gap: '0.5px' }}
          >
            {measEntries.map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center', padding: '14px 6px', background: '#F7F5EE' }}>
                <p style={{ fontSize: 9, color: '#9B9A92', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                  {k.replace(/_/g, ' ')}
                </p>
                <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: '#0f2416', lineHeight: 1 }}>
                  {String(v)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {(order.special_instructions || item.special_instructions) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {order.special_instructions && (
            <div style={{ background: '#FFFDF6', borderLeft: '3px solid #EF9F27', borderTop: '0.5px solid #FAD280', borderRight: '0.5px solid #FAD280', borderBottom: '0.5px solid #FAD280', borderRadius: '2px 12px 12px 2px', padding: '12px 16px', display: 'flex', gap: 10 }}>
              <MessageSquare style={{ width: 14, height: 14, color: '#9A5A0B', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#9A5A0B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Order Note</p>
                <p style={{ fontSize: 13, color: '#633806', lineHeight: 1.6 }}>{order.special_instructions}</p>
              </div>
            </div>
          )}
          {item.special_instructions && (
            <div style={{ background: '#FFFDF6', borderLeft: '3px solid #EF9F27', borderTop: '0.5px solid #FAD280', borderRight: '0.5px solid #FAD280', borderBottom: '0.5px solid #FAD280', borderRadius: '2px 12px 12px 2px', padding: '12px 16px', display: 'flex', gap: 10 }}>
              <MessageSquare style={{ width: 14, height: 14, color: '#9A5A0B', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#9A5A0B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Item Note</p>
                <p style={{ fontSize: 13, color: '#633806', lineHeight: 1.6 }}>{item.special_instructions}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
