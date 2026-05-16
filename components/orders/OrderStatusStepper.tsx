import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import type { OrderStatus } from '@/types/app.types'
import { Check } from 'lucide-react'

const FLOW: OrderStatus[] = [
  'draft', 'confirmed', 'assigned', 'in_tailoring',
  'in_embroidery', 'quality_check', 'ready', 'delivered',
]

const SHORT_LABEL: Record<string, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  in_tailoring: 'Tailoring',
  in_embroidery: 'Embroidery',
  quality_check: 'QC',
  ready: 'Ready',
  delivered: 'Delivered',
}

interface OrderStatusStepperProps {
  currentStatus: OrderStatus
}

export function OrderStatusStepper({ currentStatus }: OrderStatusStepperProps) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 py-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: '#FCEBEB', color: '#791F1F' }}
        >
          ✕
        </div>
        <span className="text-sm font-medium" style={{ color: '#791F1F' }}>Order Cancelled</span>
      </div>
    )
  }

  const currentIndex = FLOW.indexOf(currentStatus)
  const progressPct = Math.round(((currentIndex + 1) / FLOW.length) * 100)
  const currentLabel = ORDER_STATUSES.find(s => s.value === currentStatus)?.label ?? currentStatus

  return (
    <div>
      {/* Mobile: compact progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: '#0f2416' }}>{currentLabel}</span>
          <span className="text-[10px] tabular-nums" style={{ color: '#888780' }}>
            {currentIndex + 1} / {FLOW.length}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#F1EFE8' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${progressPct}%`, background: '#0f2416', transition: 'width 0.3s ease' }}
          />
        </div>
        {/* Mini step dots */}
        <div className="flex justify-between mt-2.5 px-0.5">
          {FLOW.map((status, i) => {
            const isDone = i < currentIndex
            const isCurrent = i === currentIndex
            return (
              <div
                key={status}
                className="flex flex-col items-center gap-1"
                style={{ flex: 1, minWidth: 0 }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mx-auto"
                  style={{
                    background: isDone ? '#0f2416' : isCurrent ? '#0f2416' : '#D3D1C7',
                    opacity: isCurrent ? 1 : isDone ? 0.6 : 0.4,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px]" style={{ color: '#B4B2A9' }}>Draft</span>
          <span className="text-[9px]" style={{ color: '#B4B2A9' }}>Delivered</span>
        </div>
      </div>

      {/* Desktop: full horizontal stepper */}
      <div className="hidden sm:flex items-start w-full">
        {FLOW.map((status, i) => {
          const isDone = i < currentIndex
          const isCurrent = i === currentIndex
          return (
            <div key={status} className="flex items-start" style={{ flex: 1, minWidth: 0 }}>
              <div className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    ...(isDone
                      ? { background: '#0f2416', color: '#fff' }
                      : isCurrent
                      ? { background: '#fff', border: '2px solid #0f2416', color: '#0f2416' }
                      : { background: '#F1EFE8', color: '#B4B2A9', border: '0.5px solid #D3D1C7' }),
                  }}
                >
                  {isDone ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span
                  className="text-center leading-tight mt-1"
                  style={{
                    fontSize: 9,
                    maxWidth: 56,
                    wordBreak: 'break-word',
                    ...(isCurrent
                      ? { color: '#0f2416', fontWeight: 600 }
                      : isDone
                      ? { color: '#5F5E5A' }
                      : { color: '#B4B2A9' }),
                  }}
                >
                  {SHORT_LABEL[status] ?? status}
                </span>
              </div>
              {i < FLOW.length - 1 && (
                <div
                  style={{
                    height: 2,
                    flex: '0 0 auto',
                    width: 12,
                    marginTop: 12,
                    background: isDone ? '#0f2416' : '#D3D1C7',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
