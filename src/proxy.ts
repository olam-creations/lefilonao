import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const GATE_PATH = '/gate'
const LOGIN_PATH = '/login'
const GATE_COOKIE = 'lefilonao_gate'

const GATE_PUBLIC = [
  '/gate', '/api/gate', '/api/auth/', '/api/stripe/webhook',
  '/api/ai/batch-analyze',
  '/', '/login', '/subscribe', '/pricing', '/success',
  '/mentions-legales', '/politique-confidentialite', '/cgu', '/cgv',
  '/forgot-password', '/reset-password', '/auth/callback', '/auth/confirm'
]
const SKIP_PATHS = ['/_next/', '/favicon.ico', '/favicon.svg', '/robots.txt', '/sitemap.xml', '/icon', '/monitoring']
const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/appels-doffres', '/api/ai', '/api/documents', '/api/market', '/api/watchlist', '/api/settings', '/api/alerts', '/api/pipeline', '/api/opportunities', '/api/rfps', '/api/feedback', '/api/ao-views']
const AUTH_SELF_MANAGED = ['/api/ai/batch-analyze']

function shouldSkip(pathname: string): boolean {
  return SKIP_PATHS.some(p => pathname === p || pathname.startsWith(p))
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (shouldSkip(pathname)) {
    return NextResponse.next()
  }

  if (pathname === '/dashboard/opportunities' || pathname.startsWith('/dashboard/opportunities/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace('/dashboard/opportunities', '/appels-doffres')
    return NextResponse.redirect(url, 301)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Fallback if env vars aren't loaded yet to avoid crash
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const withCookies = (res: NextResponse) => {
    response.cookies.getAll().forEach(cookie => {
      res.cookies.set(cookie.name, cookie.value, cookie)
    })
    return res
  }

  if (process.env.SITE_PASSWORD) {
    const isGatePublic = GATE_PUBLIC.some(p =>
      p === '/' ? pathname === '/' : (p.endsWith('/') ? pathname.startsWith(p) : pathname === p)
    )
    const isAuthRoute = pathname.startsWith('/auth/') || pathname.startsWith('/api/auth/')
    
    if (!isGatePublic && !isAuthRoute) {
      const gateCookie = request.cookies.get(GATE_COOKIE)?.value
      if (!gateCookie) {
        const url = request.nextUrl.clone()
        url.pathname = GATE_PATH
        url.searchParams.set('redirect', pathname)
        return withCookies(NextResponse.redirect(url))
      }
    }
  }

  const isSelfManaged = AUTH_SELF_MANAGED.some(p => pathname === p)
  const needsAuth = !isSelfManaged && AUTH_REQUIRED_PREFIXES.some(p => pathname.startsWith(p))

  if (needsAuth && !user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.searchParams.set('redirect', pathname)
    return withCookies(NextResponse.redirect(url))
  }

  if (pathname === '/login' && user) {
    return withCookies(NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
