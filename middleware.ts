import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from '@/lib/auth/jwt';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth/cookies';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/api/profile', '/api/auth/update-password', '/api/auth/update-email'];
// Routes only for unauthenticated users
const AUTH_ROUTES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // ── Try to verify access token ─────────────────────────────────────────────
  let user = accessToken ? await verifyAccessToken(accessToken) : null;

  // ── If access token expired, try refreshing with refresh token ─────────────
  if (!user && refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      // Issue a new access token
      const newAccessToken = await signAccessToken({
        userId: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
        name: refreshPayload.name,
      });
      user = refreshPayload;

      // Create response based on path
      let response;
      if (isProtected && pathname.startsWith('/api/')) {
          response = NextResponse.next();
      } else if (isAuthRoute) {
          response = NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
          response = NextResponse.next();
      }

      response.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 15,
      });
      return response;
    }
  }

  // ── Protect routes ─────────────────────────────────────────────────────────
  if (isProtected && !user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── RBAC: Admin only routes ──────────────────────────────────────────────
  const adminPrefixes = [
    '/dashboard/cooperativas',
    '/dashboard/cooperados',
    '/dashboard/users',
    '/dashboard/postos-trabalho',
    '/api/cooperativas',
    '/api/cooperados',
    '/api/users',
    '/api/postos-trabalho'
  ];

  const isAdminRoute = adminPrefixes.some(prefix => pathname.startsWith(prefix));
  
  if (isAdminRoute && user && user.role !== 'ADM' && user.role !== 'admin') {
     console.log(`[Middleware] Acesso negado para ${user.email} na rota ${pathname}`);
     if (pathname.startsWith('/api/')) {
       return NextResponse.json({ error: 'Acesso negado: Apenas administradores' }, { status: 403 });
     }
     return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── Redirect authenticated users away from auth pages ─────────────────────
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image
     * - favicon.ico
     * - Public files (svg, png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
