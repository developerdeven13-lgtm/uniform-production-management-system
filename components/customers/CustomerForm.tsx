'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createCustomer, updateCustomer } from '@/actions/customers'
import type { Customer, ActionResult } from '@/types/app.types'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}

interface CustomerFormProps {
  customer?: Customer
}

const initialState: ActionResult<Customer> = { success: true, data: {} as Customer }

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter()
  const isEditing = Boolean(customer)

  const boundAction = customer
    ? updateCustomer.bind(null, customer.id)
    : createCustomer

  const [state, action] = useActionState(boundAction, initialState)
  const [phoneValue, setPhoneValue] = useState(customer?.phone ?? '')
  const [dupWarning, setDupWarning] = useState<string | null>(null)

  useEffect(() => {
    if (state.success && state.data?.id) {
      toast.success(isEditing ? 'Customer updated' : 'Customer created')
      router.push(`/customers/${state.data.id}`)
    }
  }, [state, isEditing, router])

  const handlePhoneBlur = async () => {
    if (isEditing || phoneValue.length < 7) return
    const { searchCustomersForDedup } = await import('@/actions/customers')
    const result = await searchCustomersForDedup(phoneValue)
    if (result.success && result.data.length > 0) {
      setDupWarning(`Possible duplicate: ${result.data[0]?.full_name} (${result.data[0]?.phone})`)
    } else {
      setDupWarning(null)
    }
  }

  const inputCls = (field: string) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      !state.success && state.fieldErrors?.[field]
        ? 'border-red-300 bg-red-50'
        : 'border-slate-300'
    }`

  const err = (field: string) => {
    if (!state.success && state.fieldErrors?.[field]) {
      return <p className="mt-1 text-xs text-red-600">{state.fieldErrors[field]?.[0]}</p>
    }
    return null
  }

  return (
    <form action={action} className="space-y-5">
      {!state.success && !state.fieldErrors && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={customer?.full_name}
            required
            placeholder="Dr. Sita Sharma"
            className={inputCls('full_name')}
          />
          {err('full_name')}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={customer?.phone}
            required
            placeholder="+91 98765 43210"
            className={inputCls('phone')}
            value={phoneValue}
            onChange={e => setPhoneValue(e.target.value)}
            onBlur={handlePhoneBlur}
          />
          {err('phone')}
          {dupWarning && (
            <p className="mt-1 text-xs text-amber-600">⚠ {dupWarning}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone_alt" className="block text-sm font-medium text-slate-700 mb-1">
            Alternate Phone
          </label>
          <input
            id="phone_alt"
            name="phone_alt"
            type="tel"
            defaultValue={customer?.phone_alt ?? ''}
            placeholder="+91 98765 43210"
            className={inputCls('phone_alt')}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={customer?.email ?? ''}
            placeholder="doctor@hospital.com"
            className={inputCls('email')}
          />
          {err('email')}
        </div>

        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-slate-700 mb-1">
            Organization / Hospital
          </label>
          <input
            id="organization"
            name="organization"
            defaultValue={customer?.organization ?? ''}
            placeholder="City Hospital"
            className={inputCls('organization')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={customer?.address ?? ''}
          placeholder="Street, City, State"
          className={inputCls('address')}
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={customer?.notes ?? ''}
          placeholder="Any special notes about this customer…"
          className={inputCls('notes')}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={isEditing ? 'Update Customer' : 'Create Customer'} />
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
