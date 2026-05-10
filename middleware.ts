import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types/app.types'

// Routes accessible without authentication
const PUBLIC_ROUTES = ['/login', '/reset-password', '/update-password']

// Role-based route prefix access
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
  // Check from most specific to least specific
  const sortedRoutes = Object.keys(ROLE_ROUTE_MAP).sort((a, b) => b.length - a.length)
  for (const route of sortedRoutes) {
    if (pathname.includes(route)) {
      const allowed = ROLE_ROUTE_MAP[route]
      return allowed !== undefined && allowed.includes(role)
    }
  }
  return true // allow unknown routes (handled by page-level guards)
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — always call getUser() not getSession()
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api/')

  // Unauthenticated: redirect to login (except public routes + API routes)
  if (!user && !isPublicRoute && !isApiRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user hitting login page: redirect to dashboard
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Role-based access control
  if (user && !isPublicRoute && !isApiRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Deactivated user: force logout
    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
    }

    if (profile && !hasRouteAccess(pathname, profile.role as UserRole)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
