import { cn } from '@/lib/utils/cn'
import { AMBIGUITY_THRESHOLD } from '@/lib/ai/extract-order-fields'
import { Cpu, AlertTriangle, CheckCircle } from 'lucide-react'

interface AIFieldHighlightProps {
  fieldPath: string
  confidence: number | null
  isConfirmed: boolean
  onConfirm?: () => void
  children: React.ReactNode
  className?: string
}

export function AIFieldHighlight({
  fieldPath,
  confidence,
  isConfirmed,
  onConfirm,
  children,
  className,
}: AIFieldHighlightProps) {
  if (confidence === null) return <>{children}</>

  const isAmbiguous = confidence < AMBIGUITY_THRESHOLD
  const borderColor = isConfirmed
    ? 'border-green-400 bg-green-50/30'
    : isAmbiguous
      ? 'border-amber-400 bg-amber-50/40'
      : 'border-blue-300 bg-blue-50/20'

  return (
    <div className={cn('relative rounded-lg border-2 p-0.5', borderColor, className)}>
      {children}

      {/* Badge */}
      <div className="absolute -top-2.5 right-2 flex items-center gap-1">
        {isConfirmed ? (
          <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-300">
            <CheckCircle className="w-2.5 h-2.5" />
            Confirmed
          </span>
        ) : isAmbiguous ? (
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-300 hover:bg-amber-200 transition-colors"
            title={`Confidence: ${Math.round(confidence * 100)}% — click to confirm`}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            {Math.round(confidence * 100)}% — Confirm?
          </button>
        ) : (
          <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-300">
            <Cpu className="w-2.5 h-2.5" />
            AI
          </span>
        )}
      </div>
    </div>
  )
}
