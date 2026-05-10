import { CustomerForm } from '@/components/customers/CustomerForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default async function NewCustomerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/customers" className="hover:text-slate-700">Customers</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">New Customer</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Customer</h1>
        <p className="text-sm text-slate-500 mt-0.5">Add a new customer to the system</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <CustomerForm />
      </div>
    </div>
  )
}
