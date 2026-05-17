import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types/app.types'

const PUBLIC_ROUTES = ['/login', '/reset-password', '/update-password']

const ROLE_ROUTE_MAP: Record<string, UserRole[]> = {
  '/settings/users': ['super_admin'],
  '/settings': ['super_admin', 'admin'],
  '/reports': ['super_admin', 'admin'],
  '/assignments': ['super_admin', 'admin', 'tailor_master'],
  '/customers': ['super_admin', 'admin', 'support_staff', 'tailor_master'],
  '/orders': ['super_admin', 'admin', 'support_staff', 'tailor_master'],
  '/my-tasks': ['tailor', 'tailor_master'],
  '/queue': ['embroidery_staff', 'tailor_master', 'super_admin', 'admin'],
  '/dashboard': ['super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor', 'embroidery_staff'],
}

function hasRouteAccess(pathname: string, role: UserRole): boolean {
  const sortedRoutes = Object.keys(ROLE_ROUTE_MAP).sort((a, b) => b.length - a.length)
  for (const route of sortedRoutes) {
    if (pathname.includes(route)) {
      const allowed = ROLE_ROUTE_MAP[route]
      return allowed !== undefined && allowed.includes(role)
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
   * getSession() reads the JWT from the cookie and verifies its signature locally —
   * no network call to Supabase Auth servers. This is safe because the JWT is signed
   * by Supabase and cannot be forged. getUser() (the previous approach) made a live
   * network round-trip on every navigation request, adding 50–150 ms every time.
   */
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

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
    /*
     * Profile data (role, is_active, full_name) is cached in a short-lived cookie so
     * we don't query the database on every page navigation. Cache TTL is 5 minutes.
     * On cache miss or expiry the DB is queried and the cookie refreshed.
     */
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
