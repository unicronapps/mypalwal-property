import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/properties/new',
  '/properties/edit',
  '/enquiries',
  '/visits',
];

// Routes that require dealer role
// TODO: [PHASE-4] Add dealer route protection
const DEALER_ROUTES = [
  '/dealer',
];

// Auth routes — redirect to home if already logged in
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has a refresh token cookie (proxy for "logged in")
  // Note: we can't verify JWT in middleware without the secret client-side,
  // so we use the cookie existence as a hint. The actual auth check happens
  // server-side and in AuthContext on client.
  const hasRefreshToken = request.cookies.has('refresh_token');

  // Redirect logged-in users away from auth pages
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && hasRefreshToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect dashboard/profile routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) && !hasRefreshToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
