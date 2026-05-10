import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/app.types'

export interface ServerUser {
  id: string
  role: UserRole
  full_name: string
}

/**
 * Reads the authenticated user from request headers set by middleware.
 * Zero Supabase calls — middleware already verified the session.
 * Redirects to /login if not authenticated.
 */
export async function requireUser(): Promise<ServerUser> {
  const h = await headers()
  const id = h.get('x-user-id')
  const role = h.get('x-user-role') as UserRole | null
  const full_name = h.get('x-user-name') ?? ''

  if (!id || !role) redirect('/login')

  return { id, role, full_name }
}
