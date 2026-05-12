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
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: '#5F5E5A' }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-[14px] h-[14px] text-white text-[9px] font-bold rounded-full flex items-center justify-center"
            style={{ background: '#E24B4A' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 z-50 overflow-hidden"
          style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid #F1EFE8' }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: '#2C2C2A' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1"
                style={{ fontSize: 11, color: '#0f2416', fontWeight: 500 }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto" style={{ borderTop: 'none' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <Bell className="w-7 h-7 mx-auto mb-2" style={{ color: '#D3D1C7' }} />
                <p style={{ fontSize: 12, color: '#888780' }}>No notifications yet</p>
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
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 16px',
        borderBottom: '0.5px solid #F1EFE8',
        background: !n.is_read ? '#FAEEDA20' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
        {NOTIFICATION_ICONS[n.type] ?? '🔔'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 600, color: '#2C2C2A' }}>
          {n.title}
        </p>
        <p style={{ fontSize: 11, color: '#5F5E5A', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {n.body}
        </p>
        <p style={{ fontSize: 10, color: '#888780', marginTop: 4 }}>{formatRelativeTime(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <button
          onClick={() => onMarkRead(n.id)}
          style={{ flexShrink: 0, padding: 4, color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}
          title="Mark as read"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
