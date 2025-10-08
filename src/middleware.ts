import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth');
  const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks');

  // Allow access to auth endpoints and webhooks
  if (isApiAuth || isWebhook) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!sessionToken && !isLoginPage) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Redirect to home if authenticated and trying to access login
  if (sessionToken && isLoginPage) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
