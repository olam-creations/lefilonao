import { NextRequest, NextResponse } from 'next/server';

const GATE_PATH = '/gate';
const LOGIN_PATH = '/login';
const GATE_PUBLIC = [
  '/gate', '/api/',
  '/', '/login', '/subscribe', '/pricing', '/success',
  '/mentions-legales', '/politique-confidentialite', '/cgu', '/cgv',
];
const AUTH_PUBLIC = ['/', '/login', '/subscribe', '/pricing', '/success'];
const SKIP_PATHS = ['/_next/', '/favicon.ico', '/favicon.svg', '/robots.txt', '/sitemap.xml', '/icon', '/monitoring'];
const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/api/ai', '/api/documents'];

function shouldSkip(pathname: string): boolean {
  return SKIP_PATHS.some(p => pathname === p || pathname.startsWith(p));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and SEO files
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // ─── Layer 1: Staging gate ───
  // When SITE_PASSWORD is configured, require lefilonao_access cookie
  // Public pages, legal pages, and API routes bypass the gate
  if (process.env.SITE_PASSWORD) {
    const isGatePublic = GATE_PUBLIC.some(p =>
      p.endsWith('/') ? pathname.startsWith(p) : pathname === p
    );
    if (!isGatePublic) {
      const accessCookie = request.cookies.get('lefilonao_access')?.value;
      if (!accessCookie) {
        const url = request.nextUrl.clone();
        url.pathname = GATE_PATH;
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // ─── Layer 2: Dashboard auth ───
  // Protected routes require lefilonao_session cookie (production only)
  const isDev = process.env.NODE_ENV === 'development';
  const needsAuth = AUTH_REQUIRED_PREFIXES.some(p => pathname.startsWith(p));
  if (needsAuth && !isDev) {
    const sessionCookie = request.cookies.get('lefilonao_session')?.value;
    if (!sessionCookie) {
      // API routes get 401, pages get redirected to /login
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // ─── Layer 3: Redirect authenticated users away from login/subscribe ───
  if (pathname === '/login' || pathname === '/subscribe') {
    const sessionCookie = request.cookies.get('lefilonao_session')?.value;
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
