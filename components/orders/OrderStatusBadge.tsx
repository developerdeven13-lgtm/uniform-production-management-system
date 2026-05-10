import { STATUS_LABEL, STATUS_COLOR } from '@/lib/constants/order-statuses'
import type { OrderStatus } from '@/types/app.types'
import { cn } from '@/lib/utils/cn'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        STATUS_COLOR[status],
        className
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
