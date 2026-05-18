import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types/app.types'
import type { Permission } from '@/lib/permissions/permissions'
import { getPermissions } from '@/lib/permissions/permissions'

const PUBLIC_ROUTES = ['/login', '/reset-password', '/update-password']

/*
 * Maps route prefixes to the permission(s) that grant access.
 * Checked against the user's ROLE DEFAULT permissions only (no per-user
 * overrides) — middleware cannot reliably invalidate another user's session
 * cookie when an admin changes privileges. Fine-grained override enforcement
 * is the responsibility of each page via requirePermission().
 *
 * A user has route access if their role holds AT LEAST ONE listed permission.
 * Routes not listed here are accessible to all authenticated users.
 */
const ROUTE_PERMISSION_MAP: Record<string, Permission[]> = {
  '/settings/users': ['users.manage'],
  '/settings':       ['settings.manage'],
  '/reports':        ['analytics.read'],
  '/assignments':    ['assignments.create', 'assignments.read'],
  '/customers':      ['customers.read'],
  '/orders':         ['orders.read.all'],
  '/my-tasks':       ['orders.read.own'],
  '/queue':          ['embroidery.update', 'embroidery.assign'],
}

function hasRouteAccess(pathname: string, role: UserRole): boolean {
  const sortedRoutes = Object.keys(ROUTE_PERMISSION_MAP).sort((a, b) => b.length - a.length)
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      const required = ROUTE_PERMISSION_MAP[route]
      if (!required || required.length === 0) return true
      const rolePerms = new Set(getPermissions(role))
      return required.some(p => rolePerms.has(p))
    }
  }
  return true
}

const PROFILE_CACHE_COOKIE = '__pc'
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CachedProfile {
  role: string
  is_active: boolean
  full_name: string
  exp: number
}

function readCachedProfile(request: NextRequest, userId: string): CachedProfile | null {
  const raw = request.cookies.get(PROFILE_CACHE_COOKIE)?.value
  if (!raw) return null
  try {
    const parsed: CachedProfile & { uid: string } = JSON.parse(raw)
    if (parsed.uid !== userId) return null
    if (parsed.exp < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(c => pendingCookies.push(c as typeof pendingCookies[0]))
        },
      },
    }
  )

  /*
   * getUser() verifies the JWT with Supabase Auth servers on every request.
   * Detects revoked sessions and tampered cookies that getSession() misses.
   */
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isApiRoute = pathname.startsWith('/api/')

  if (!user && !isPublicRoute && !isApiRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (user && !isPublicRoute && !isApiRoute) {
    let profile = readCachedProfile(request, user.id)

    if (!profile) {
      const { data } = await supabase
        .from('profiles')
        .select('role, is_active, full_name')
        .eq('id', user.id)
        .single()

      if (data) {
        profile = { ...data, exp: Date.now() + PROFILE_CACHE_TTL_MS }
        pendingCookies.push({
          name: PROFILE_CACHE_COOKIE,
          value: JSON.stringify({ ...profile, uid: user.id }),
          options: {
            maxAge: PROFILE_CACHE_TTL_MS / 1000,
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
          },
        })
      }
    }

    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
    }

    if (profile && !hasRouteAccess(pathname, profile.role as UserRole)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (profile) {
      requestHeaders.set('x-user-id', user.id)
      requestHeaders.set('x-user-role', profile.role)
      requestHeaders.set('x-user-name', profile.full_name)
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
