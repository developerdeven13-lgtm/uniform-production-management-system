'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { assignTailor, reassignTailor } from '@/actions/assignments'
import type { Profile } from '@/types/app.types'
import { ROLE_LABELS } from '@/lib/permissions/roles'
import { Loader2, UserCheck } from 'lucide-react'

interface AssignmentFormProps {
  orderItemId: string
  orderId: string
  currentTailorId?: string | null
  tailors: Profile[]
  onSuccess?: () => void
}

export function AssignmentForm({
  orderItemId,
  orderId,
  currentTailorId,
  tailors,
  onSuccess,
}: AssignmentFormProps) {
  const isReassign = Boolean(currentTailorId)
  const [tailorId, setTailorId] = useState(currentTailorId ?? '')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tailorId) return

    startTransition(async () => {
      let result
      if (isReassign) {
        result = await reassignTailor(orderItemId, tailorId, reason)
      } else {
        result = await assignTailor(
          orderItemId,
          tailorId,
          estimatedHours ? Number(estimatedHours) : undefined
        )
      }

      if (result.success) {
        toast.success(isReassign ? 'Tailor reassigned' : 'Tailor assigned')
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Select Tailor <span className="text-red-500">*</span>
        </label>
        <select
          value={tailorId}
          onChange={e => setTailorId(e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Choose tailor —</option>
          {tailors.map(t => (
            <option key={t.id} value={t.id}>
              {t.full_name} ({ROLE_LABELS[t.role]})
            </option>
          ))}
        </select>
      </div>

      {!isReassign && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Estimated Hours
          </label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            placeholder="e.g. 3.5"
            value={estimatedHours}
            onChange={e => setEstimatedHours(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {isReassign && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason for Reassignment <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            minLength={5}
            placeholder="Why is this being reassigned?"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !tailorId}
        className="flex items-center gap-2 w-full justify-center py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserCheck className="w-4 h-4" />
        )}
        {isReassign ? 'Reassign Tailor' : 'Assign Tailor'}
      </button>
    </form>
  )
}
