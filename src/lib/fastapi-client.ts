/**
 * Typed client for the FastAPI backend (Railway).
 *
 * Server-side only — uses FASTAPI_URL + FASTAPI_AUTH_TOKEN env vars.
 * All requests forward the caller's email via X-User-Email header
 * so FastAPI can enforce feature gating on the correct user.
 */

const getBaseUrl = (): string => {
  const url = process.env.FASTAPI_URL
  if (!url) throw new Error('FASTAPI_URL not configured')
  return url.replace(/\/$/, '')
}

const getAuthToken = (): string => {
  const token = process.env.FASTAPI_AUTH_TOKEN
  if (!token) throw new Error('FASTAPI_AUTH_TOKEN not configured')
  return token
}

/**
 * In dev mode, requireAuth returns 'dev@lefilonao.local' which doesn't exist
 * in Supabase. Use the first ALLOWED_EMAILS entry so FastAPI can resolve the plan.
 */
function resolveEmail(email: string): string {
  if (email === 'dev@lefilonao.local' && process.env.ALLOWED_EMAILS) {
    return process.env.ALLOWED_EMAILS.split(',')[0].trim()
  }
  return email
}

interface FastApiOptions {
  /** Authenticated user email (forwarded via X-User-Email) */
  userEmail?: string
  /** AbortSignal for cancellation */
  signal?: AbortSignal
  /** Request timeout in ms (default 30_000) */
  timeout?: number
}

interface FastApiResponse<T> {
  ok: boolean
  status: number
  data: T | null
  error: string | null
}

async function request<T>(
  method: string,
  path: string,
  body: unknown | undefined,
  options: FastApiOptions = {},
): Promise<FastApiResponse<T>> {
  const { userEmail, signal, timeout = 30_000 } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getAuthToken()}`,
    'Content-Type': 'application/json',
  }
  if (userEmail) {
    headers['X-User-Email'] = userEmail
  }

  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combinedSignal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, status: res.status, data: null, error: text || res.statusText }
    }

    const data = (await res.json()) as T
    return { ok: true, status: res.status, data, error: null }
  } catch (err) {
    clearTimeout(timeoutId)
    const message = err instanceof Error ? err.message : 'FastAPI request failed'
    return { ok: false, status: 0, data: null, error: message }
  }
}

/**
 * Proxy a Next.js GET request to FastAPI, forwarding query params.
 * Handles auth (cookie → email), rate limiting stays in Next.js.
 * FastAPI handles feature gating via X-User-Email.
 */
export async function proxyGet(
  req: import('next/server').NextRequest,
  fastapiPath: string,
  cache?: string,
): Promise<Response> {
  const { requireAuth } = await import('@/lib/require-auth')
  const { rateLimit, STANDARD_LIMIT } = await import('@/lib/rate-limit')

  const limited = await rateLimit(req, STANDARD_LIMIT)
  if (limited) return limited

  const auth = requireAuth(req)
  if (!auth.ok) return auth.response

  const qs = req.nextUrl.search
  const res = await fastapi.get(fastapiPath + qs, { userEmail: resolveEmail(auth.auth.email) })

  if (!res.ok) {
    return Response.json(
      { error: res.error ?? 'Erreur backend' },
      { status: res.status || 502 },
    )
  }

  const response = Response.json(res.data)
  if (cache) {
    response.headers.set('Cache-Control', cache)
  }
  return response
}

/**
 * Proxy a Next.js POST (multipart/form-data) to FastAPI.
 * Forwards the raw FormData body (files + fields) to FastAPI.
 * Uses AI_LIMIT rate limiting.
 */
export async function proxyFormData(
  req: import('next/server').NextRequest,
  fastapiPath: string,
  timeout = 90_000,
): Promise<Response> {
  const { requireAuth } = await import('@/lib/require-auth')
  const { rateLimit, AI_LIMIT } = await import('@/lib/rate-limit')

  const limited = await rateLimit(req, AI_LIMIT)
  if (limited) return limited

  const auth = requireAuth(req)
  if (!auth.ok) return auth.response

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json(
      { success: false, error: 'Request must be multipart/form-data' },
      { status: 400 },
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const combinedSignal = req.signal
    ? AbortSignal.any([req.signal, controller.signal])
    : controller.signal

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getAuthToken()}`,
    'X-User-Email': resolveEmail(auth.auth.email),
  }

  try {
    const res = await fetch(`${getBaseUrl()}${fastapiPath}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: combinedSignal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return Response.json(
        { success: false, error: text || res.statusText },
        { status: res.status || 502 },
      )
    }

    const data = await res.json()
    return Response.json(data)
  } catch (err) {
    clearTimeout(timeoutId)
    const message = err instanceof Error ? err.message : 'FastAPI request failed'
    return Response.json({ success: false, error: message }, { status: 502 })
  }
}

/**
 * Proxy a Next.js POST (JSON) to FastAPI, returning JSON.
 * Uses AI_LIMIT rate limiting.
 */
export async function proxyPost(
  req: import('next/server').NextRequest,
  fastapiPath: string,
  timeout = 90_000,
): Promise<Response> {
  const { requireAuth } = await import('@/lib/require-auth')
  const { rateLimit, AI_LIMIT } = await import('@/lib/rate-limit')

  const limited = await rateLimit(req, AI_LIMIT)
  if (limited) return limited

  const auth = requireAuth(req)
  if (!auth.ok) return auth.response

  const body = await req.json()
  const res = await fastapi.post(fastapiPath, body, {
    userEmail: resolveEmail(auth.auth.email),
    signal: req.signal,
    timeout,
  })

  if (!res.ok) {
    return Response.json(
      { error: res.error ?? 'Erreur backend' },
      { status: res.status || 502 },
    )
  }

  return Response.json(res.data)
}

/**
 * Proxy a Next.js POST (JSON) to FastAPI and passthrough SSE stream.
 * Uses AI_LIMIT rate limiting.
 */
export async function proxyPostStream(
  req: import('next/server').NextRequest,
  fastapiPath: string,
  timeout = 90_000,
): Promise<Response> {
  const { requireAuth } = await import('@/lib/require-auth')
  const { rateLimit, AI_LIMIT } = await import('@/lib/rate-limit')

  const limited = await rateLimit(req, AI_LIMIT)
  if (limited) return limited

  const auth = requireAuth(req)
  if (!auth.ok) return auth.response

  const body = await req.json()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const combinedSignal = req.signal
    ? AbortSignal.any([req.signal, controller.signal])
    : controller.signal

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getAuthToken()}`,
    'Content-Type': 'application/json',
    'X-User-Email': resolveEmail(auth.auth.email),
  }

  try {
    const res = await fetch(`${getBaseUrl()}${fastapiPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: combinedSignal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return Response.json(
        { error: text || res.statusText },
        { status: res.status || 502 },
      )
    }

    // Passthrough the SSE stream from FastAPI
    if (!res.body) {
      return Response.json({ error: 'No stream body' }, { status: 502 })
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    clearTimeout(timeoutId)
    const message = err instanceof Error ? err.message : 'FastAPI request failed'
    return Response.json({ error: message }, { status: 502 })
  }
}

const CACHE_1H = 'public, s-maxage=3600, stale-while-revalidate=7200'
const CACHE_5M = 'public, s-maxage=300, stale-while-revalidate=600'

export { CACHE_1H, CACHE_5M }

export const fastapi = {
  get: <T>(path: string, options?: FastApiOptions) =>
    request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: FastApiOptions) =>
    request<T>('POST', path, body, options),

  put: <T>(path: string, body?: unknown, options?: FastApiOptions) =>
    request<T>('PUT', path, body, options),

  delete: <T>(path: string, options?: FastApiOptions) =>
    request<T>('DELETE', path, undefined, options),
}
