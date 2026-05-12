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
      style={{
        width: '100%',
        padding: '10px 16px',
        background: pending ? '#5F5E5A' : '#0f2416',
        color: '#fff',
        border: 'none',
        borderRadius: 9,
        fontSize: 13,
        fontWeight: 500,
        cursor: pending ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
        marginTop: 4,
      }}
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm() {
  const [state, action] = useActionState(login, initialState)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '0.5px solid #D3D1C7',
    borderRadius: 9,
    fontSize: 13,
    color: '#2C2C2A',
    background: '#F7F5EE',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: '#5F5E5A',
    marginBottom: 5,
  }

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!state.success && !state.fieldErrors && (
        <div style={{ borderRadius: 9, background: '#FCEBEB', border: '0.5px solid #F7C1C1', padding: '10px 14px', fontSize: 12, color: '#791F1F' }}>
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" style={labelStyle}>Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          style={inputStyle}
          placeholder="you@hospital.com"
        />
        {!state.success && state.fieldErrors?.['email'] && (
          <p style={{ marginTop: 4, fontSize: 11, color: '#791F1F' }}>{state.fieldErrors['email']?.[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" style={labelStyle}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          style={inputStyle}
          placeholder="••••••••"
        />
        {!state.success && state.fieldErrors?.['password'] && (
          <p style={{ marginTop: 4, fontSize: 11, color: '#791F1F' }}>{state.fieldErrors['password']?.[0]}</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link
          href="/reset-password"
          style={{ fontSize: 11, color: '#0f2416', fontWeight: 500, textDecoration: 'none' }}
        >
          Forgot password?
        </Link>
      </div>

      <SubmitButton />
    </form>
  )
}
