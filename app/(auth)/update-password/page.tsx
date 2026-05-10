'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updatePassword } from '@/actions/auth'
import type { ActionResult } from '@/types/app.types'

const initialState: ActionResult<null> = { success: true, data: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Updating…' : 'Update password'}
    </button>
  )
}

export default function UpdatePasswordPage() {
  const [state, action] = useActionState(updatePassword, initialState)

  return (
    <>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Set new password</h2>
      <p className="text-sm text-slate-500 mb-6">Choose a strong password for your account</p>

      <form action={action} className="space-y-4">
        {!state.success && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
          {!state.success && state.fieldErrors?.['password'] && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors['password']?.[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
          {!state.success && state.fieldErrors?.['confirmPassword'] && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors['confirmPassword']?.[0]}</p>
          )}
        </div>
        <SubmitButton />
      </form>
    </>
  )
}
