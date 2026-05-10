'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatRelativeTime } from '@/lib/utils/format-date'
import type { Notification } from '@/types/app.types'
import { cn } from '@/lib/utils/cn'

const NOTIFICATION_ICONS: Record<string, string> = {
  order_created: '📋',
  order_status_changed: '🔄',
  order_assigned: '👤',
  order_ready: '✅',
  order_delivered: '📦',
  embroidery_requested: '🧵',
  quality_check_failed: '⚠️',
  mention: '💬',
}

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification: n,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
}) {
  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors',
        !n.is_read && 'bg-blue-50/50'
      )}
    >
      <span className="text-lg shrink-0 mt-0.5">
        {NOTIFICATION_ICONS[n.type] ?? '🔔'}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !n.is_read ? 'font-medium text-slate-900' : 'text-slate-700')}>
          {n.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <button
          onClick={() => onMarkRead(n.id)}
          className="shrink-0 p-1 text-slate-400 hover:text-blue-600 rounded"
          title="Mark as read"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
