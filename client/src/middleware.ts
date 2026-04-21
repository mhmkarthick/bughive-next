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

  // For dashboard routes, if no access token cookie at all redirect to login.
  // Important: only do this for full document navigations. Redirecting RSC/data
  // requests can result in a blank screen during client-side navigation.
  //
  // Note: We intentionally use a client-set cookie (`bh_at`) rather than relying on
  // upstream Set-Cookie headers from a separate API host. This keeps Vercel+Railway
  // deployments stable even when proxy/cookie forwarding differs by platform.
  const accessTokenCookie = req.cookies.get('bh_at')?.value
  const accept = req.headers.get('accept') || ''
  const isDocumentNav = req.method === 'GET' && accept.includes('text/html')
  if (pathname.startsWith('/dashboard') && !accessTokenCookie && isDocumentNav) {
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
