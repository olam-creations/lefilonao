import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'lefilonao_access';
const LOGIN_PATH = '/gate';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip gate page, API routes, static files, and SEO files
  if (
    pathname === LOGIN_PATH ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/icon'
  ) {
    return NextResponse.next();
  }

  // If no SITE_PASSWORD set, site is open (production mode)
  if (!process.env.SITE_PASSWORD) {
    return NextResponse.next();
  }

  // Check access cookie
  const accessCookie = request.cookies.get(COOKIE_NAME)?.value;
  if (accessCookie === 'granted') {
    return NextResponse.next();
  }

  // Redirect to gate
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
