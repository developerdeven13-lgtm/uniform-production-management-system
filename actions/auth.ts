'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/app.types'

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export async function login(
  _prevState: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  const raw = Object.fromEntries(formData)
  const parsed = LoginSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: 'Invalid email or password' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(
  _prevState: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  const raw = Object.fromEntries(formData)
  const parsed = ResetPasswordSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
  })

  if (error) {
    return { success: false, error: 'Failed to send reset email. Please try again.' }
  }

  return { success: true, data: null }
}

export async function updatePassword(
  _prevState: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  const raw = Object.fromEntries(formData)
  const parsed = UpdatePasswordSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { success: false, error: 'Failed to update password. The link may have expired.' }
  }

  redirect('/dashboard')
}
