'use client'

import { useRouter } from 'next/navigation'

export function ClickableOrderRow({
  orderId,
  children,
}: {
  orderId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <tr
      onClick={() => router.push(`/orders/${orderId}`)}
      className="cursor-pointer transition-colors"
      style={{ borderBottom: '0.5px solid #F1EFE8' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F7F5EE')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </tr>
  )
}
