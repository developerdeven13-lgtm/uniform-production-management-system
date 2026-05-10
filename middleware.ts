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

export async function middleware(request: NextRequest) {
  // Build augmented request headers — we'll add user data to them after auth
  const requestHeaders = new Headers(request.headers)

  // Collect cookies that Supabase wants to set (to apply them to the response later)
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(c => pendingCookies.push(c as typeof pendingCookies[0]))
        },
      },
    }
  )

  // Single getUser() call for the entire request — result forwarded to pages via headers
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active, full_name')
      .eq('id', user.id)
      .single()

    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
    }

    if (profile && !hasRouteAccess(pathname, profile.role as UserRole)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Forward user data as request headers so server components can read them
    // without making additional Supabase calls
    if (profile) {
      requestHeaders.set('x-user-id', user.id)
      requestHeaders.set('x-user-role', profile.role)
      requestHeaders.set('x-user-name', profile.full_name)
    }
  }

  // Build the final response with augmented request headers
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Apply any Supabase auth cookies (token refresh)
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
