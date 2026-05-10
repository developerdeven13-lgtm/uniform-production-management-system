import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import type { OrderStatus } from '@/types/app.types'
import { cn } from '@/lib/utils/cn'
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
      <div className="flex items-center gap-2 py-3">
        <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-red-500" />
        </span>
        <span className="text-sm font-medium text-red-600">Order Cancelled</span>
      </div>
    )
  }

  const currentIndex = FLOW.indexOf(currentStatus)

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {FLOW.map((status, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        const label = ORDER_STATUSES.find(s => s.value === status)?.label ?? status

        return (
          <div key={status} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                  isDone ? 'bg-blue-600 border-blue-600 text-white' :
                  isCurrent ? 'bg-white border-blue-600 text-blue-600' :
                  'bg-white border-slate-200 text-slate-400'
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] mt-1 whitespace-nowrap max-w-[60px] text-center leading-tight',
                isCurrent ? 'text-blue-600 font-medium' :
                isDone ? 'text-slate-500' : 'text-slate-400'
              )}>
                {label}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <div className={cn(
                'h-0.5 w-6 mx-1 mb-4 transition-colors',
                isDone ? 'bg-blue-600' : 'bg-slate-200'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
