import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the token from the cookies
  const token = request.cookies.get('token')?.value
  
  // Define auth required paths
  const authRequiredPaths = [
    '/',
    '/products',
    '/requests',
    '/reports',
    '/settings',
  ]
  
  // Define auth not required paths
  const authNotRequiredPaths = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
  ]
  
  // Check if the current path requires authentication
  const isAuthRequiredPath = authRequiredPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  )
  
  // Check if the current path is an auth path (login, signup, etc.)
  const isAuthPath = authNotRequiredPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  )
  
  // If the path requires auth and there's no token, redirect to login
  if (isAuthRequiredPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // If the user is already logged in and tries to access auth pages, redirect to home
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 