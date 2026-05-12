import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import type { OrderStatus } from '@/types/app.types'
import { Check } from 'lucide-react'

const FLOW: OrderStatus[] = [
  'draft', 'confirmed', 'assigned', 'in_tailoring',
  'in_embroidery', 'quality_check', 'ready', 'delivered',
]

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

  return (
    <div className="flex items-start w-full overflow-x-auto pb-1">
      {FLOW.map((status, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        const label = ORDER_STATUSES.find(s => s.value === status)?.label ?? status

        return (
          <div key={status} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={
                  isDone
                    ? { background: '#0f2416', color: '#fff' }
                    : isCurrent
                    ? { background: '#fff', border: '2px solid #0f2416', color: '#0f2416' }
                    : { background: '#F1EFE8', color: '#B4B2A9', border: '0.5px solid #D3D1C7' }
                }
              >
                {isDone ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className="text-[9px] mt-1 text-center leading-tight max-w-[52px]"
                style={
                  isCurrent
                    ? { color: '#0f2416', fontWeight: 500 }
                    : isDone
                    ? { color: '#5F5E5A' }
                    : { color: '#888780' }
                }
              >
                {label}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <div
                className="h-[2px] flex-1 mt-[12px] mx-1"
                style={{ background: isDone ? '#0f2416' : '#D3D1C7' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
