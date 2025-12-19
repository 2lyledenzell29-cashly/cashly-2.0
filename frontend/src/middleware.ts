import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('wallet_app_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/register'];
  
  // Admin routes that require admin role
  const adminRoutes = ['/admin'];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  
  // Check if the current path is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin routes, we'll need to verify the user role on the client side
  // since we can't decode JWT in middleware without the secret
  if (isAdminRoute) {
    // Let the request through, but the ProtectedRoute component will handle admin verification
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};