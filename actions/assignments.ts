'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult, TailorAssignment, Profile } from '@/types/app.types'
import { dispatchNotification } from '@/actions/notifications'

// ============================================================
// GET TAILORS (for assignment dropdown)
// ============================================================
export async function getTailors(): Promise<ActionResult<Profile[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['tailor', 'tailor_master'])
    .eq('is_active', true)
    .order('full_name')

  if (error) return { success: false, error: 'Failed to fetch tailors' }
  return { success: true, data: (data ?? []) as Profile[] }
}

// ============================================================
// GET TAILOR WORKLOAD
// ============================================================
export async function getTailorWorkload(): Promise<ActionResult<{
  tailor: Profile
  activeCount: number
  completedCount: number
}[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: tailors } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['tailor', 'tailor_master'])
    .eq('is_active', true)
    .order('full_name')

  if (!tailors) return { success: true, data: [] }

  const workload = await Promise.all(
    tailors.map(async tailor => {
      const [{ count: activeCount }, { count: completedCount }] = await Promise.all([
        supabase
          .from('tailor_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('tailor_id', tailor.id)
          .eq('is_active', true)
          .is('completed_at', null),
        supabase
          .from('tailor_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('tailor_id', tailor.id)
          .not('completed_at', 'is', null),
      ])
      return {
        tailor: tailor as Profile,
        activeCount: activeCount ?? 0,
        completedCount: completedCount ?? 0,
      }
    })
  )

  return { success: true, data: workload }
}

// ============================================================
// ASSIGN TAILOR TO ORDER ITEM
// ============================================================
export async function assignTailor(
  orderItemId: string,
  tailorId: string,
  estimatedHours?: number,
  notes?: string
): Promise<ActionResult<TailorAssignment>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'tailor_master'].includes(profile.role)) {
    return { success: false, error: 'Forbidden: only admin/tailor master can assign tailors' }
  }

  // Deactivate any existing active assignment for this item
  await supabase
    .from('tailor_assignments')
    .update({ is_active: false })
    .eq('order_item_id', orderItemId)
    .eq('is_active', true)

  const { data, error } = await supabase
    .from('tailor_assignments')
    .insert({
      order_item_id: orderItemId,
      tailor_id: tailorId,
      assigned_by: user.id,
      estimated_hours: estimatedHours ?? null,
      notes: notes ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error || !data) return { success: false, error: 'Failed to assign tailor' }

  // Update order item status to 'assigned'
  const { data: orderItem } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', orderItemId)
    .single()

  if (orderItem) {
    await supabase
      .from('order_items')
      .update({ status: 'assigned' })
      .eq('id', orderItemId)

    // Update parent order status if all items are assigned
    const { data: allItems } = await supabase
      .from('order_items')
      .select('status')
      .eq('order_id', orderItem.order_id)

    const allAssigned = allItems?.every(i =>
      ['assigned', 'in_tailoring', 'in_embroidery', 'quality_check', 'ready', 'delivered'].includes(i.status)
    )
    if (allAssigned) {
      await supabase
        .from('orders')
        .update({ status: 'assigned' })
        .eq('id', orderItem.order_id)
        .eq('status', 'confirmed')
    }

    // Notify the assigned tailor
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderItem.order_id)
        .single()

      await dispatchNotification({
        type: 'order_assigned',
        recipientIds: [tailorId],
        title: 'New assignment',
        body: `You have been assigned to order ${order?.order_number ?? ''}`,
        data: { order_id: orderItem.order_id, order_item_id: orderItemId },
      })
    } catch { /* non-fatal */ }

    revalidatePath(`/orders/${orderItem.order_id}`)
    revalidatePath('/assignments')
  }

  return { success: true, data: data as TailorAssignment }
}

// ============================================================
// REASSIGN TAILOR
// ============================================================
export async function reassignTailor(
  orderItemId: string,
  newTailorId: string,
  reason: string
): Promise<ActionResult<TailorAssignment>> {
  if (!reason || reason.trim().length < 5) {
    return { success: false, error: 'Please provide a reason for reassignment' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Get current assignment to notify old tailor
  const { data: currentAssignment } = await supabase
    .from('tailor_assignments')
    .select('tailor_id, order_item_id')
    .eq('order_item_id', orderItemId)
    .eq('is_active', true)
    .maybeSingle()

  const result = await assignTailor(orderItemId, newTailorId)

  // Notify old tailor of reassignment
  if (result.success && currentAssignment?.tailor_id) {
    try {
      await dispatchNotification({
        type: 'order_status_changed',
        recipientIds: [currentAssignment.tailor_id],
        title: 'Assignment removed',
        body: `Your assignment has been reassigned. Reason: ${reason}`,
        data: { order_item_id: orderItemId },
      })
    } catch { /* non-fatal */ }
  }

  return result
}

// ============================================================
// MARK ITEM AS STARTED (tailor starts work)
// ============================================================
export async function markItemStarted(orderItemId: string): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  await supabase
    .from('tailor_assignments')
    .update({ started_at: new Date().toISOString() })
    .eq('order_item_id', orderItemId)
    .eq('tailor_id', user.id)
    .eq('is_active', true)

  const { data: item } = await supabase
    .from('order_items')
    .update({ status: 'in_tailoring' })
    .eq('id', orderItemId)
    .select('order_id')
    .single()

  if (item) {
    await supabase
      .from('orders')
      .update({ status: 'in_tailoring' })
      .eq('id', item.order_id)
      .in('status', ['assigned', 'confirmed'])

    revalidatePath(`/orders/${item.order_id}`)
    revalidatePath('/my-tasks')
  }

  return { success: true, data: undefined }
}

// ============================================================
// MARK ITEM COMPLETE (tailor finishes)
// ============================================================
export async function markItemComplete(orderItemId: string): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const now = new Date().toISOString()

  await supabase
    .from('tailor_assignments')
    .update({ completed_at: now })
    .eq('order_item_id', orderItemId)
    .eq('tailor_id', user.id)
    .eq('is_active', true)

  const { data: item } = await supabase
    .from('order_items')
    .update({ status: 'quality_check' })
    .eq('id', orderItemId)
    .select('order_id, has_embroidery')
    .single()

  if (item) {
    // If all items done with tailoring, move order forward
    const { data: siblings } = await supabase
      .from('order_items')
      .select('status, has_embroidery')
      .eq('order_id', item.order_id)

    const allDone = siblings?.every(s =>
      ['quality_check', 'ready', 'delivered', 'in_embroidery'].includes(s.status)
    )
    if (allDone) {
      const hasEmbroidery = siblings?.some(s => s.has_embroidery)
      await supabase
        .from('orders')
        .update({ status: hasEmbroidery ? 'in_embroidery' : 'quality_check' })
        .eq('id', item.order_id)
    }

    revalidatePath(`/orders/${item.order_id}`)
    revalidatePath('/my-tasks')
  }

  return { success: true, data: undefined }
}

// ============================================================
// GET MY ASSIGNMENTS (for tailor)
// ============================================================
export async function getMyAssignments(): Promise<ActionResult<unknown[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('tailor_assignments')
    .select(`
      *,
      order_item:order_items(
        *,
        order:orders(id, order_number, status, delivery_date, customer:customers(full_name, phone)),
        measurements:order_measurements(*),
        media:media_attachments(*)
      )
    `)
    .eq('tailor_id', user.id)
    .eq('is_active', true)
    .is('completed_at', null)
    .order('assigned_at', { ascending: false })

  if (error) return { success: false, error: 'Failed to fetch assignments' }
  return { success: true, data: data ?? [] }
}
