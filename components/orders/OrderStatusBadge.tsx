import { STATUS_LABEL, STATUS_STYLE } from '@/lib/constants/order-statuses'
import type { OrderStatus } from '@/types/app.types'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const style = STATUS_STYLE[status] ?? { background: '#F1EFE8', color: '#444441' }
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: '99px',
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
