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
      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
    >
      {children}
    </tr>
  )
}
