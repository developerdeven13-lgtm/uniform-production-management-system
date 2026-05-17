'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchNotification } from '@/actions/notifications'
import type { ActionResult, OrderFlag, FlagStatus } from '@/types/app.types'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const ALLOWED_VOICE_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VOICE_BYTES = 25 * 1024 * 1024

// ============================================================
// RAISE FLAG
// ============================================================
export async function raiseFlag(formData: FormData): Promise<ActionResult<OrderFlag>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['tailor', 'tailor_master', 'super_admin', 'admin'].includes(profile.role)) {
    return { success: false, error: 'Only tailors and admins can raise flags' }
  }

  const orderId = formData.get('order_id') as string
  const orderItemId = (formData.get('order_item_id') as string) || null
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!orderId || !title) {
    return { success: false, error: 'Order and title are required' }
  }

  // Verify order exists
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('id', orderId)
    .single()

  if (!order) return { success: false, error: 'Order not found' }

  // Create the flag
  const { data: flag, error: flagError } = await supabase
    .from('order_flags')
    .insert({ order_id: orderId, order_item_id: orderItemId, raised_by: user.id, title, description })
    .select()
    .single()

  if (flagError || !flag) {
    console.error('[raiseFlag] insert error:', flagError)
    return { success: false, error: flagError?.message ?? 'Failed to create flag' }
  }

  // Handle media attachments (images + voice notes)
  const files = formData.getAll('media') as File[]
  if (files.length > 0) {
    await uploadFlagMedia(flag.id, orderId, files, user.id)
  }

  // Notify all admins / super_admins
  try {
    const adminClient = createAdminClient()
    const { data: admins } = await adminClient
      .from('profiles')
      .select('id')
      .in('role', ['super_admin', 'admin'])
      .eq('is_active', true)
      .neq('id', user.id)

    if (admins?.length) {
      await dispatchNotification({
        type: 'flag_raised',
        recipientIds: admins.map(a => a.id),
        title: `Flag raised on ${order.order_number}`,
        body: `${profile.full_name}: ${title}`,
        data: { order_id: orderId, flag_id: flag.id },
      })
    }
  } catch { /* non-fatal */ }

  revalidatePath(`/orders/${orderId}`)

  return { success: true, data: flag as OrderFlag }
}

// ============================================================
// UPLOAD FLAG MEDIA (internal helper)
// ============================================================
async function uploadFlagMedia(
  flagId: string,
  orderId: string,
  files: File[],
  uploadedBy: string
) {
  const supabase = await createClient()

  await Promise.all(
    files.map(async (file) => {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
      const isVoice = ALLOWED_VOICE_TYPES.includes(file.type)
      if (!isImage && !isVoice) return
      if (isImage && file.size > MAX_IMAGE_BYTES) return
      if (isVoice && file.size > MAX_VOICE_BYTES) return

      const ext = file.name.split('.').pop() ?? 'bin'
      const folder = isVoice ? 'voice-notes' : 'images'
      const path = `${orderId}/flags/${crypto.randomUUID()}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from('order-media')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (storageErr) return

      await supabase.from('media_attachments').insert({
        order_id: orderId,
        flag_id: flagId,
        media_type: isVoice ? 'voice_note' : 'image',
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        storage_bucket: 'order-media',
        storage_path: path,
        uploaded_by: uploadedBy,
      })
    })
  )
}

// ============================================================
// GET FLAGS FOR ORDER
// ============================================================
export async function getOrderFlags(orderId: string): Promise<ActionResult<OrderFlag[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('order_flags')
    .select(`
      *,
      raiser:profiles!order_flags_raised_by_fkey(id, full_name, role),
      resolver:profiles!order_flags_resolved_by_fkey(id, full_name),
      media:media_attachments(id, media_type, file_name, file_size_bytes, mime_type, storage_path, storage_bucket, duration_seconds, uploaded_by, created_at, flag_id)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: 'Failed to fetch flags' }

  // Generate signed URLs for media
  const flagsWithUrls = await Promise.all(
    (data ?? []).map(async (flag) => {
      const mediaWithUrls = await Promise.all(
        (flag.media ?? []).map(async (m: { storage_bucket: string; storage_path: string }) => {
          const { data: signed } = await supabase.storage
            .from(m.storage_bucket)
            .createSignedUrl(m.storage_path, 3600)
          return { ...m, signedUrl: signed?.signedUrl ?? null }
        })
      )
      return { ...flag, media: mediaWithUrls }
    })
  )

  return { success: true, data: flagsWithUrls as OrderFlag[] }
}

// ============================================================
// UPDATE FLAG STATUS
// ============================================================
export async function updateFlagStatus(
  flagId: string,
  status: FlagStatus,
  resolutionNote?: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'tailor_master'].includes(profile.role)) {
    return { success: false, error: 'Only managers can update flag status' }
  }

  const update: Record<string, unknown> = { status }

  if (status === 'acknowledged') {
    update.acknowledged_by = user.id
    update.acknowledged_at = new Date().toISOString()
  }
  if (status === 'resolved') {
    update.resolved_by = user.id
    update.resolved_at = new Date().toISOString()
    if (resolutionNote) update.resolution_note = resolutionNote
  }

  const { data: flag, error } = await supabase
    .from('order_flags')
    .update(update)
    .eq('id', flagId)
    .select('order_id, raised_by')
    .single()

  if (error || !flag) return { success: false, error: 'Failed to update flag' }

  // Notify the person who raised it
  if (status === 'resolved' && flag.raised_by !== user.id) {
    try {
      await dispatchNotification({
        type: 'flag_resolved',
        recipientIds: [flag.raised_by],
        title: 'Your flag has been resolved',
        body: resolutionNote ?? 'An admin has resolved your flag.',
        data: { order_id: flag.order_id, flag_id: flagId },
      })
    } catch { /* non-fatal */ }
  }

  revalidatePath(`/orders/${flag.order_id}`)
  return { success: true, data: undefined }
}
