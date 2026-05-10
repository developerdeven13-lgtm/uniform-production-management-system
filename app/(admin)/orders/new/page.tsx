import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { NewOrderShell } from '@/components/orders/NewOrderShell'
import type { Customer } from '@/types/app.types'

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string; mode?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  let prefillCustomer: Customer | undefined

  if (params.customer_id) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.customer_id)
      .single()
    if (data) prefillCustomer = data as Customer
  }

  const initialMode = params.mode === 'ai' ? 'ai' : 'manual'

  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/orders" className="hover:text-slate-700">Orders</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">New Order</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Order</h1>
        <p className="text-sm text-slate-500 mt-0.5">Create a production order manually or via AI voice intake</p>
      </div>

      <NewOrderShell prefillCustomer={prefillCustomer} initialMode={initialMode} />
    </div>
  )
}
