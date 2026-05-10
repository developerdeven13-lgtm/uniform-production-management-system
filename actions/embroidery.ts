'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, EmbroideryDetail } from '@/types/app.types'
import { dispatchNotification } from '@/actions/notifications'

// ============================================================
// CREATE / UPSERT EMBROIDERY DETAIL
// ============================================================
export async function createEmbroideryDetail(data: {
  order_item_id: string
  embroidery_type?: string
  placement?: string
  thread_colors?: string[]
  name_text?: string
  font_style?: string
  special_instructions?: string
}): Promise<ActionResult<EmbroideryDetail>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'tailor_master'].includes(profile.role)) {
    return { success: false, error: 'Forbidden' }
  }

  // Mark the order item as having embroidery
  await supabase
    .from('order_items')
    .update({ has_embroidery: true })
    .eq('id', data.order_item_id)

  const { data: result, error } = await supabase
    .from('embroidery_details')
    .insert({
      order_item_id: data.order_item_id,
      embroidery_type: data.embroidery_type ?? null,
      placement: data.placement ?? null,
      thread_colors: data.thread_colors ?? null,
      name_text: data.name_text ?? null,
      font_style: data.font_style ?? null,
      special_instructions: data.special_instructions ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !result) return { success: false, error: 'Failed to create embroidery detail' }
  return { success: true, data: result as EmbroideryDetail }
}

// ============================================================
// ASSIGN EMBROIDERY STAFF
// ============================================================
export async function assignEmbroideryStaff(
  embroideryDetailId: string,
  staffId: string
): Promise<ActionResult<EmbroideryDetail>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'tailor_master'].includes(profile.role)) {
    return { success: false, error: 'Forbidden' }
  }

  const { data, error } = await supabase
    .from('embroidery_details')
    .update({
      assigned_to: staffId,
      assigned_by: user.id,
      assigned_at: new Date().toISOString(),
      status: 'in_progress',
    })
    .eq('id', embroideryDetailId)
    .select()
    .single()

  if (error || !data) return { success: false, error: 'Failed to assign embroidery staff' }

  // Notify the staff member
  try {
    await dispatchNotification({
      type: 'embroidery_requested',
      recipientIds: [staffId],
      title: 'New embroidery task',
      body: 'You have been assigned an embroidery task',
      data: { embroidery_detail_id: embroideryDetailId },
    })
  } catch { /* non-fatal */ }

  revalidatePath('/queue')
  return { success: true, data: data as EmbroideryDetail }
}

// ============================================================
// UPDATE EMBROIDERY STATUS (embroidery staff action)
// ============================================================
export async function updateEmbroideryStatus(
  embroideryDetailId: string,
  status: 'in_progress' | 'completed' | 'rejected',
  rejectionReason?: string
): Promise<ActionResult<EmbroideryDetail>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const updateData: Record<string, unknown> = { status }
  if (status === 'in_progress') updateData['started_at'] = new Date().toISOString()
  if (status === 'completed') updateData['completed_at'] = new Date().toISOString()
  if (status === 'rejected') updateData['rejection_reason'] = rejectionReason ?? ''

  const { data, error } = await supabase
    .from('embroidery_details')
    .update(updateData)
    .eq('id', embroideryDetailId)
    .select('*, order_item_id')
    .single()

  if (error || !data) return { success: false, error: 'Failed to update embroidery status' }

  // If completed, update parent order item
  if (status === 'completed') {
    const { data: item } = await supabase
      .from('order_items')
      .update({ status: 'quality_check' })
      .eq('id', data.order_item_id)
      .select('order_id')
      .single()

    if (item) revalidatePath(`/orders/${item.order_id}`)
  }

  revalidatePath('/queue')
  return { success: true, data: data as EmbroideryDetail }
}

// ============================================================
// GET EMBROIDERY QUEUE
// ============================================================
export async function getEmbroideryQueue(): Promise<ActionResult<unknown[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('embroidery_details')
    .select(`
      *,
      order_item:order_items(
        *,
        order:orders(id, order_number, delivery_date, customer:customers(full_name))
      ),
      assignee:profiles!embroidery_details_assigned_to_fkey(id, full_name)
    `)
    .in('status', ['pending', 'in_progress'])
    .order('assigned_at', { ascending: true })

  // Embroidery staff only see their own tasks
  if (profile?.role === 'embroidery_staff') {
    query = query.eq('assigned_to', user.id)
  }

  const { data, error } = await query
  if (error) return { success: false, error: 'Failed to fetch embroidery queue' }
  return { success: true, data: data ?? [] }
}
