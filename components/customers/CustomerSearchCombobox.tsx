'use client'

import { useState, useCallback } from 'react'
import { Search, X, UserPlus, Loader2 } from 'lucide-react'
import { searchCustomers } from '@/actions/customers'
import type { Customer } from '@/types/app.types'
import Link from 'next/link'

interface CustomerSearchComboboxProps {
  value: Customer | null
  onChange: (customer: Customer | null) => void
}

export function CustomerSearchCombobox({ value, onChange }: CustomerSearchComboboxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const search = useCallback(async (q: string) => {
    setQuery(q)
    if (q.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const result = await searchCustomers(q)
      if (result.success) {
        setResults(result.data)
        setOpen(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const select = (customer: Customer) => {
    onChange(customer)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  // Show selected customer
  if (value) {
    return (
      <div className="flex items-center justify-between p-3 border-2 border-blue-300 bg-blue-50 rounded-lg">
        <div>
          <p className="text-sm font-semibold text-slate-900">{value.full_name}</p>
          <p className="text-xs text-slate-500">
            {value.phone}
            {value.organization ? ` · ${value.organization}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove customer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search by name, phone, or organization…"
          className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {results.length > 0 ? (
            <>
              {results.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => select(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-sm font-bold text-slate-600">
                    {c.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {c.phone}
                      {c.organization ? ` · ${c.organization}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </>
          ) : query.trim().length >= 2 && !loading ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-slate-500 mb-3">
                No customers found for &ldquo;{query}&rdquo;
              </p>
              <Link
                href={`/customers/new`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Create new customer
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {/* Hint text */}
      {!open && (
        <p className="text-xs text-slate-400 mt-1.5">
          Type at least 2 characters to search. No customers yet?{' '}
          <Link href="/customers/new" className="text-blue-500 hover:text-blue-700 underline">
            Create one first
          </Link>
        </p>
      )}
    </div>
  )
}
