'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Order, OrderStatus, ActionResult } from '@/types/app.types'
import { ORDER_STATUS_TRANSITIONS } from '@/types/app.types'

// ============================================================
// CREATE ORDER
// ============================================================
export async function createOrder(data: {
  customer_id: string
  delivery_date?: string | null
  priority?: number
  special_instructions?: string | null
  notes?: string | null
  ai_intake_used?: boolean
  ai_transcript?: string | null
  ai_confidence?: number | null
  items: Array<{
    product_type: string
    quantity: number
    color?: string | null
    piping_color?: string | null
    has_embroidery?: boolean
    embroidery_name?: string | null
    special_instructions?: string | null
    unit_price?: number | null
  }>
}): Promise<ActionResult<Order>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Check profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'support_staff'].includes(profile.role)) {
    return { success: false, error: 'Forbidden: only admin/support staff can create orders' }
  }

  if (!data.items || data.items.length === 0) {
    return { success: false, error: 'Order must have at least one item' }
  }

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: data.customer_id,
      delivery_date: data.delivery_date ?? null,
      priority: data.priority ?? 2,
      special_instructions: data.special_instructions ?? null,
      notes: data.notes ?? null,
      ai_intake_used: data.ai_intake_used ?? false,
      ai_transcript: data.ai_transcript ?? null,
      ai_confidence: data.ai_confidence ?? null,
      created_by: user.id,
      status: 'draft',
    })
    .select()
    .single()

  if (orderError || !order) {
    return { success: false, error: 'Failed to create order' }
  }

  // Insert order items
  const itemsToInsert = data.items.map((item, i) => ({
    order_id: order.id,
    sequence_number: i + 1,
    product_type: item.product_type,
    quantity: item.quantity,
    color: item.color ?? null,
    piping_color: item.piping_color ?? null,
    has_embroidery: item.has_embroidery ?? false,
    embroidery_name: item.embroidery_name ?? null,
    special_instructions: item.special_instructions ?? null,
    unit_price: item.unit_price ?? null,
    status: 'draft' as OrderStatus,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // Rollback order
    await supabase.from('orders').delete().eq('id', order.id)
    return { success: false, error: 'Failed to create order items' }
  }

  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'order.create',
      resource_type: 'order',
      resource_id: order.id,
      after_state: { order_number: order.order_number, customer_id: order.customer_id },
    })
  } catch { /* non-fatal */ }

  revalidatePath('/orders')
  return { success: true, data: order as Order }
}

// ============================================================
// TRANSITION ORDER STATUS
// ============================================================
export async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  reason?: string
): Promise<ActionResult<Order>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return { success: false, error: 'Profile not found' }

  const { data: currentOrder } = await supabase
    .from('orders')
    .select('id, status, order_number')
    .eq('id', orderId)
    .single()

  if (!currentOrder) return { success: false, error: 'Order not found' }

  // Enforce state machine
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentOrder.status as OrderStatus]
  const roleTransitions = allowedTransitions[profile.role as keyof typeof allowedTransitions] ?? []

  if (!roleTransitions.includes(toStatus)) {
    return {
      success: false,
      error: `Cannot transition from ${currentOrder.status} to ${toStatus} as ${profile.role}`,
    }
  }

  const updateData: Record<string, unknown> = { status: toStatus }
  if (toStatus === 'confirmed') {
    updateData['confirmed_by'] = user.id
    updateData['confirmed_at'] = new Date().toISOString()
  }

  const { data: updated, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .eq('status', currentOrder.status) // optimistic concurrency check
    .select()
    .single()

  if (error || !updated) {
    return { success: false, error: 'Status update failed — order may have changed. Please refresh.' }
  }

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  return { success: true, data: updated as Order }
}

// ============================================================
// CANCEL ORDER
// ============================================================
export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<ActionResult<Order>> {
  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Cancellation reason must be at least 10 characters' }
  }
  return transitionOrderStatus(orderId, 'cancelled', reason)
}

// ============================================================
// GET ORDERS (list)
// ============================================================
export async function getOrders(params: {
  page?: number
  pageSize?: number
  status?: OrderStatus[]
  customerId?: string
} = {}): Promise<ActionResult<{ orders: Order[]; total: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('orders')
    .select('*, customer:customers(id, full_name, phone, organization)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status)
  }
  if (params.customerId) {
    query = query.eq('customer_id', params.customerId)
  }

  const { data, count, error } = await query

  if (error) return { success: false, error: 'Failed to fetch orders' }
  return { success: true, data: { orders: (data ?? []) as Order[], total: count ?? 0 } }
}

// ============================================================
// GET SINGLE ORDER with items
// ============================================================
export async function getOrder(orderId: string): Promise<ActionResult<Order>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(
        *,
        measurements:order_measurements(*),
        assignment:tailor_assignments(*, tailor:profiles(id, full_name, role)),
        embroidery_detail:embroidery_details(*),
        media:media_attachments(*)
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !data) return { success: false, error: 'Order not found' }
  return { success: true, data: data as Order }
}

// ============================================================
// SAVE MEASUREMENTS FOR ORDER ITEM
// ============================================================
export async function saveMeasurements(
  orderItemId: string,
  customerId: string,
  productType: string,
  measurements: Record<string, number | string | null>
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Upsert measurements (one set per order item)
  const { data: existing } = await supabase
    .from('order_measurements')
    .select('id')
    .eq('order_item_id', orderItemId)
    .maybeSingle()

  let result
  if (existing) {
    result = await supabase
      .from('order_measurements')
      .update({ ...measurements, measured_by: user.id, measured_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id')
      .single()
  } else {
    result = await supabase
      .from('order_measurements')
      .insert({
        order_item_id: orderItemId,
        customer_id: customerId,
        product_type: productType,
        ...measurements,
        measured_by: user.id,
        measured_at: new Date().toISOString(),
      })
      .select('id')
      .single()
  }

  if (result.error || !result.data) {
    return { success: false, error: 'Failed to save measurements' }
  }

  return { success: true, data: { id: result.data.id } }
}

// ============================================================
// GET STATUS HISTORY (timeline)
// ============================================================
export async function getOrderTimeline(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('order_status_history')
    .select('*, profile:profiles(id, full_name, role)')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: 'Failed to fetch timeline' }
  return { success: true, data: data ?? [] }
}

// ============================================================
// DELETE DRAFT ORDER
// ============================================================
export async function deleteDraftOrder(orderId: string): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return { success: false, error: 'Forbidden' }
  }

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .eq('status', 'draft')

  if (error) return { success: false, error: 'Failed to delete order (must be in draft status)' }

  revalidatePath('/orders')
  redirect('/orders')
}
