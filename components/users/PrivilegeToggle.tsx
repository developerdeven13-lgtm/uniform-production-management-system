'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, RotateCcw } from 'lucide-react'
import { setPrivilegeOverride } from '@/actions/users'
import type { Permission } from '@/lib/permissions/permissions'

interface Props {
  userId: string
  permission: Permission
  effective: boolean
  isOverridden: boolean
  roleDefault: boolean
}

export function PrivilegeToggle({ userId, permission, effective, isOverridden, roleDefault }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    const newGranted = !effective
    startTransition(async () => {
      // If toggling back to role default, remove the override entirely
      const granted = newGranted === roleDefault ? null : newGranted
      const result = await setPrivilegeOverride(userId, permission, granted)
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      const result = await setPrivilegeOverride(userId, permission, null)
      if (result.success) { router.refresh() }
      else toast.error(result.error)
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      {/* Reset override button (only visible when overridden) */}
      {isOverridden && (
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          title="Reset to role default"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, background: '#F1EFE8', border: '0.5px solid #D3D1C7', cursor: 'pointer', color: '#888780' }}
        >
          <RotateCcw style={{ width: 11, height: 11 }} />
        </button>
      )}

      {/* Toggle */}
      {isPending ? (
        <Loader2 style={{ width: 16, height: 16, color: '#888780', animation: 'spin 1s linear infinite' }} />
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          style={{
            width: 42, height: 24, borderRadius: 12, border: isOverridden ? '2px solid #0f2416' : '1.5px solid transparent',
            cursor: 'pointer', position: 'relative', transition: 'background 0.2s, border-color 0.2s',
            background: effective ? '#0f2416' : '#D3D1C7',
            outline: 'none',
          }}
          title={isOverridden ? 'Override active — click to toggle, reset button to restore default' : effective ? 'Granted by role — click to revoke' : 'Not granted — click to grant'}
        >
          <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: effective ? 20 : 2 }} />
        </button>
      )}
    </div>
  )
}
