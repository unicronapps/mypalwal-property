import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is handled client-side via localStorage tokens.
// Middleware only passes through — no server-side cookie checks.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
