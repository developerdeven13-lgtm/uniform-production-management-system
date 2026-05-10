export const ORDER_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  { value: 'assigned', label: 'Assigned', color: 'bg-purple-100 text-purple-700' },
  { value: 'in_tailoring', label: 'In Tailoring', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_embroidery', label: 'In Embroidery', color: 'bg-orange-100 text-orange-700' },
  { value: 'quality_check', label: 'Quality Check', color: 'bg-pink-100 text-pink-700' },
  { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
] as const

export type OrderStatusValue = (typeof ORDER_STATUSES)[number]['value']

export const STATUS_LABEL: Record<OrderStatusValue, string> = Object.fromEntries(
  ORDER_STATUSES.map(s => [s.value, s.label])
) as Record<OrderStatusValue, string>

export const STATUS_COLOR: Record<OrderStatusValue, string> = Object.fromEntries(
  ORDER_STATUSES.map(s => [s.value, s.color])
) as Record<OrderStatusValue, string>
