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

  const response = NextResponse.next();

  // Add security headers to allow external resources
  // Note: CSP is intentionally relaxed to support:
  // - OAuth profile pictures (img-src)
  // - Geocoding APIs (connect-src for nominatim.openstreetmap.org)
  // - Timezone lookup APIs (connect-src for api.wheretheiss.at)
  // - Map tiles (connect-src for tile.openstreetmap.org)
  // - Leaflet CSS (style-src for cdnjs.cloudflare.com)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.wheretheiss.at https://cdn.jsdelivr.net https://*.openstreetmap.org;"
  );

  // Allow images from any HTTPS source (including Google)
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

  return response;
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
