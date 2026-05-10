import { AlertTriangle, CheckCheck } from 'lucide-react'

interface AmbiguityAlertProps {
  ambiguousCount: number
  confirmedCount: number
  onConfirmAll: () => void
}

export function AmbiguityAlert({ ambiguousCount, confirmedCount, onConfirmAll }: AmbiguityAlertProps) {
  const remaining = ambiguousCount - confirmedCount
  if (ambiguousCount === 0) return null

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${
      remaining === 0
        ? 'bg-green-50 border-green-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      {remaining === 0 ? (
        <CheckCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className={`text-sm font-medium ${remaining === 0 ? 'text-green-800' : 'text-amber-800'}`}>
          {remaining === 0
            ? 'All uncertain fields confirmed — you can submit the order'
            : `${remaining} field${remaining !== 1 ? 's' : ''} need${remaining === 1 ? 's' : ''} your review`}
        </p>
        <p className={`text-xs mt-0.5 ${remaining === 0 ? 'text-green-600' : 'text-amber-600'}`}>
          {remaining === 0
            ? 'AI extracted these with lower confidence — you have verified them.'
            : 'AI extracted these with low confidence. Click the amber badge on each field to confirm the value is correct, or edit it first.'}
        </p>
      </div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={onConfirmAll}
          className="shrink-0 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          Confirm all
        </button>
      )}
    </div>
  )
}
