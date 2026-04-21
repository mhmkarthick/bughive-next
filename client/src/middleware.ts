import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and Next.js internals
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Check for auth token in cookies (set by the server via httpOnly cookie)
  // We also check localStorage-persisted token via a custom header the client sets
  const cookieToken   = req.cookies.get('refreshToken')?.value
  const authHeader    = req.headers.get('x-auth-token')

  // For dashboard routes, if no token at all redirect to login.
  // Important: only do this for full document navigations. Redirecting RSC/data
  // requests can result in a blank screen during client-side navigation.
  const accept = req.headers.get('accept') || ''
  const isDocumentNav = req.method === 'GET' && accept.includes('text/html')
  if (pathname.startsWith('/dashboard') && !cookieToken && !authHeader && isDocumentNav) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
