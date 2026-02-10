import { NextRequest, NextResponse } from 'next/server';

const GATE_PATH = '/gate';
const LOGIN_PATH = '/login';
const GATE_COOKIE = 'lefilonao_gate';
const AUTH_COOKIE = 'lefilonao_access';

const GATE_PUBLIC = [
  '/gate', '/api/gate', '/api/auth/', '/api/stripe/webhook',
  '/', '/login', '/subscribe', '/pricing', '/success',
  '/mentions-legales', '/politique-confidentialite', '/cgu', '/cgv',
];
const SKIP_PATHS = ['/_next/', '/favicon.ico', '/favicon.svg', '/robots.txt', '/sitemap.xml', '/icon', '/monitoring'];
const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/api/ai', '/api/documents', '/api/market', '/api/watchlist', '/api/settings', '/api/alerts', '/api/pipeline', '/api/opportunities', '/api/rfps', '/api/feedback', '/api/ao-views'];

function shouldSkip(pathname: string): boolean {
  return SKIP_PATHS.some(p => pathname === p || pathname.startsWith(p));
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self' https://*.ingest.sentry.io https://plausible.io https://generativelanguage.googleapis.com https://api.anthropic.com https://integrate.api.nvidia.com https://data.economie.gouv.fr https://*.supabase.co https://lefilonao-workers.olamcreations.workers.dev https://checkout.stripe.com https://api.stripe.com",
    "font-src 'self'",
    "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
  ].join('; ') + ';';
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and SEO files
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // Generate CSP nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // ─── Layer 0: Clear invalid (pre-HMAC) auth cookies ───
  const rawAuthCookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (rawAuthCookie && rawAuthCookie.split('.').length !== 3) {
    const isPage = !pathname.startsWith('/api/');
    if (isPage) {
      const url = request.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      url.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }
    const response = NextResponse.json({ error: 'Session expirée' }, { status: 401 });
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }

  // ─── Layer 1: Staging gate (separate cookie) ───
  if (process.env.SITE_PASSWORD) {
    const isGatePublic = GATE_PUBLIC.some(p =>
      p.endsWith('/') ? pathname.startsWith(p) : pathname === p
    );
    if (!isGatePublic) {
      const gateCookie = request.cookies.get(GATE_COOKIE)?.value;
      if (!gateCookie) {
        const url = request.nextUrl.clone();
        url.pathname = GATE_PATH;
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // ─── Layer 2: Dashboard & API auth ───
  const isDev = process.env.NODE_ENV === 'development';
  const needsAuth = AUTH_REQUIRED_PREFIXES.some(p => pathname.startsWith(p));
  if (needsAuth && !isDev) {
    const sessionCookie = request.cookies.get(AUTH_COOKIE)?.value;
    if (!sessionCookie) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // ─── Layer 3: Redirect authenticated users away from login ───
  if (pathname === '/login') {
    const sessionCookie = request.cookies.get(AUTH_COOKIE)?.value;
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ─── Apply CSP nonce to response ───
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', buildCsp(nonce));

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
