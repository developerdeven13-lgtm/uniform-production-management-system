'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, MediaAttachment } from '@/types/app.types'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const ALLOWED_VOICE_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10MB
const MAX_VOICE_SIZE = 25 * 1024 * 1024  // 25MB

export async function uploadMedia(formData: FormData): Promise<ActionResult<MediaAttachment>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const file = formData.get('file') as File | null
  const orderId = formData.get('order_id') as string | null
  const orderItemId = formData.get('order_item_id') as string | null
  const mediaType = formData.get('media_type') as string

  if (!file) return { success: false, error: 'No file provided' }
  if (!orderId && !orderItemId) return { success: false, error: 'order_id or order_item_id required' }

  // Server-side MIME validation
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVoice = ALLOWED_VOICE_TYPES.includes(file.type)

  if (!isImage && !isVoice) {
    return {
      success: false,
      error: `File type not allowed. Accepted: JPEG, PNG, WebP, HEIC, WebM audio, MP3, MP4 audio`,
    }
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VOICE_SIZE
  if (file.size > maxSize) {
    const limitMB = Math.round(maxSize / 1024 / 1024)
    return { success: false, error: `File too large. Maximum size: ${limitMB}MB` }
  }

  // Sanitize filename
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const safeExt = ext.replace(/[^a-z0-9]/g, '')
  const fileName = `${crypto.randomUUID()}.${safeExt}`
  const folder = isVoice ? 'voice-notes' : 'images'
  const storagePath = `${orderId ?? orderItemId}/${folder}/${fileName}`

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('order-media')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` }
  }

  // Save metadata to DB
  const { data, error: dbError } = await supabase
    .from('media_attachments')
    .insert({
      order_id: orderId ?? null,
      order_item_id: orderItemId ?? null,
      media_type: isVoice ? 'voice_note' : 'image',
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      storage_bucket: 'order-media',
      storage_path: storagePath,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (dbError || !data) {
    // Remove orphaned file
    await supabase.storage.from('order-media').remove([storagePath])
    return { success: false, error: 'Failed to save file metadata' }
  }

  revalidatePath(`/orders/${orderId}`)
  return { success: true, data: data as MediaAttachment }
}

export async function deleteMedia(mediaId: string): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: media } = await supabase
    .from('media_attachments')
    .select('*')
    .eq('id', mediaId)
    .single()

  if (!media) return { success: false, error: 'File not found' }

  // Delete from storage first
  await supabase.storage
    .from(media.storage_bucket)
    .remove([media.storage_path])

  // Delete metadata record
  const { error } = await supabase.from('media_attachments').delete().eq('id', mediaId)
  if (error) return { success: false, error: 'Failed to delete file record' }

  if (media.order_id) revalidatePath(`/orders/${media.order_id}`)
  return { success: true, data: undefined }
}

export async function getSignedUrl(
  bucket: string,
  storagePath: string,
  expiresInSeconds = 3600
): Promise<ActionResult<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data) return { success: false, error: 'Failed to generate signed URL' }
  return { success: true, data: data.signedUrl }
}

export interface MediaWithUrl extends MediaAttachment {
  signedUrl: string | null
  uploaderName: string | null
}

// Fetch all media for an order with pre-generated signed URLs
export async function getOrderMedia(orderId: string): Promise<ActionResult<MediaWithUrl[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('media_attachments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: 'Failed to fetch media' }
  if (!data || data.length === 0) return { success: true, data: [] }

  // Generate signed URLs for all files in parallel
  const withUrls = await Promise.all(
    data.map(async (m) => {
      let signedUrl: string | null = null
      try {
        const { data: urlData } = await supabase.storage
          .from(m.storage_bucket)
          .createSignedUrl(m.storage_path, 3600) // 1-hour expiry
        signedUrl = urlData?.signedUrl ?? null
      } catch { /* leave null */ }

      return { ...m, signedUrl, uploaderName: null } as MediaWithUrl
    })
  )

  // Fetch uploader names
  const uploaderIds = [...new Set(data.map(m => m.uploaded_by))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uploaderIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))
  const result = withUrls.map(m => ({
    ...m,
    uploaderName: profileMap[m.uploaded_by] ?? null,
  }))

  return { success: true, data: result }
}
