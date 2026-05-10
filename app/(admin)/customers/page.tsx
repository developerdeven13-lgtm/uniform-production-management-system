import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils/format-date'
import type { Customer } from '@/types/app.types'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const query = params.q ?? ''
  const page = Number(params.page ?? '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let dbQuery = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (query) {
    dbQuery = dbQuery.textSearch('search_vector', query, { type: 'plain' })
  }

  const { data: customers, count } = await dbQuery
  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total</p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Customer
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, phone, email, or organization…"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {!customers || customers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm">No customers found.</p>
            <Link href="/customers/new" className="mt-3 inline-flex text-blue-600 text-sm font-medium hover:text-blue-700">
              Add your first customer →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Organization</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(customers as Customer[]).map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    {c.organization ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/customers?page=${page - 1}${query ? `&q=${query}` : ''}`}
                className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/customers?page=${page + 1}${query ? `&q=${query}` : ''}`}
                className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
