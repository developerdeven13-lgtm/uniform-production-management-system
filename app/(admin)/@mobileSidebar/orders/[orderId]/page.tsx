import { createClient } from '@/lib/supabase/server'
import { RightSidebarMobile } from '@/components/layout/RightSidebarMobile'
import { CustomerOrdersCarousel } from '@/components/orders/CustomerOrdersCarousel'

export default async function OrderDetailMobileSidebar({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const orderRes = await supabase
    .from('orders')
    .select('customer_id')
    .eq('id', orderId)
    .single()

  if (!orderRes.data) return <RightSidebarMobile />

  const { customer_id } = orderRes.data

  const [customerRes, ordersRes] = await Promise.all([
    supabase
      .from('customers')
      .select('id, full_name')
      .eq('id', customer_id)
      .single(),
    supabase
      .from('orders')
      .select('id, order_number, status, delivery_date, total_items, created_at')
      .eq('customer_id', customer_id)
      .neq('id', orderId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!customerRes.data || !ordersRes.data?.length) return <RightSidebarMobile />

  return (
    <div className="xl:hidden mt-6 pb-2">
      <CustomerOrdersCarousel
        orders={ordersRes.data}
        customerId={customerRes.data.id}
        customerName={customerRes.data.full_name}
      />
    </div>
  )
}
