'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { login } from '@/actions/auth'
import type { ActionResult } from '@/types/app.types'

const initialState: ActionResult<null> = { success: true, data: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm() {
  const [state, action] = useActionState(login, initialState)

  return (
    <form action={action} className="space-y-4">
      {!state.success && !state.fieldErrors && (
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
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
          placeholder="you@hospital.com"
        />
        {!state.success && state.fieldErrors?.['email'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['email']?.[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
          placeholder="••••••••"
        />
        {!state.success && state.fieldErrors?.['password'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['password']?.[0]}</p>
        )}
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/reset-password"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Forgot password?
        </Link>
      </div>

      <SubmitButton />
    </form>
  )
}
