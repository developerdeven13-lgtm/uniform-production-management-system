import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CustomerForm } from '@/components/customers/CustomerForm'
import type { Customer } from '@/types/app.types'

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  await requireUser()
  const supabase = await createClient()

  const { customerId } = await params
  const { data } = await supabase.from('customers').select('*').eq('id', customerId).single()
  if (!data) notFound()

  const customer = data as Customer

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/customers" className="hover:text-slate-700">Customers</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/customers/${customerId}`} className="hover:text-slate-700">{customer.full_name}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">Edit</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Customer</h1>
        <p className="text-sm text-slate-500 mt-0.5">{customer.full_name}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <CustomerForm customer={customer} />
      </div>
    </div>
  )
}
