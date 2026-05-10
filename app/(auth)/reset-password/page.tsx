'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { resetPassword } from '@/actions/auth'
import type { ActionResult } from '@/types/app.types'

const initialState: ActionResult<null> = { success: true, data: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Sending…' : 'Send reset link'}
    </button>
  )
}

export default function ResetPasswordPage() {
  const [state, action] = useActionState(resetPassword, initialState)

  if (state.success && state.data === null) {
    // After successful submission show a success message
    // (initial state also has data: null so we check if form was submitted)
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Reset password</h2>
      <p className="text-sm text-slate-500 mb-6">
        Enter your email and we&apos;ll send a reset link
      </p>

      {state.success && state.data === null ? (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700 text-center">
          Check your email for the reset link.
        </div>
      ) : (
        <form action={action} className="space-y-4">
          {!state.success && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {state.error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@hospital.com"
            />
          </div>
          <SubmitButton />
        </form>
      )}

      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
