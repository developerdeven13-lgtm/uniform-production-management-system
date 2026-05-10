'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Notification, NotificationType } from '@/types/app.types'
import { revalidatePath } from 'next/cache'

interface DispatchInput {
  type: NotificationType
  recipientIds: string[]
  title: string
  body: string
  data?: Record<string, unknown>
}

// Used internally by other server actions (not exposed as a public action directly)
export async function dispatchNotification(input: DispatchInput): Promise<void> {
  if (input.recipientIds.length === 0) return

  try {
    const admin = createAdminClient()
    await admin.from('notifications').insert(
      input.recipientIds.map(id => ({
        recipient_id: id,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? {},
      }))
    )
  } catch {
    // Notifications are non-fatal
  }
}

// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================
export async function markNotificationRead(notificationId: string): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', user.id)

  return { success: true, data: undefined }
}

// ============================================================
// MARK ALL AS READ
// ============================================================
export async function markAllNotificationsRead(): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

// ============================================================
// GET NOTIFICATIONS (for current user)
// ============================================================
export async function getNotifications(limit = 30): Promise<ActionResult<Notification[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { success: false, error: 'Failed to fetch notifications' }
  return { success: true, data: (data ?? []) as Notification[] }
}

// ============================================================
// GET UNREAD COUNT
// ============================================================
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  return count ?? 0
}
