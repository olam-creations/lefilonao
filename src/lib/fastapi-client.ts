/**
 * Typed client for the FastAPI backend (Railway).
 *
 * Uses Supabase JWT (Authorization: Bearer <USER_JWT>) for user requests.
 * Uses FASTAPI_AUTH_TOKEN for service-level requests (if any).
 */

const getBaseUrl = (): string => {
  const url = process.env.FASTAPI_URL
  if (!url) throw new Error('FASTAPI_URL not configured')
  return url.replace(/\/$/, '')
}

// Fallback for service-level calls (if needed)
const getServiceToken = (): string => {
  const token = process.env.FASTAPI_AUTH_TOKEN
  if (!token) throw new Error('FASTAPI_AUTH_TOKEN not configured')
  return token
}

interface FastApiOptions {
  /** Authenticated user email (forwarded via X-User-Email for logging/compatibility) */
  userEmail?: string
  /** User ID (X-User-Id) */
  userId?: string
  /** Access Token (Bearer) */
  accessToken?: string
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
  const { userEmail, userId, accessToken, signal, timeout = 30_000 } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal

  const headers: Record<string, string> = {
    // Always use service token for FastAPI (user identity via X-User-Email)
    Authorization: `Bearer ${getServiceToken()}`,
    'Content-Type': 'application/json',
  }
  if (userEmail) headers['X-User-Email'] = userEmail
  if (userId) headers['X-User-Id'] = userId

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
 * Authenticates via Supabase JWT.
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

  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const qs = req.nextUrl.search
  const res = await fastapi.get(fastapiPath + qs, { 
    userEmail: auth.auth.email,
    userId: auth.auth.id,
    accessToken: auth.auth.accessToken
  })

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

  const auth = await requireAuth(req)
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
    Authorization: `Bearer ${getServiceToken()}`,
    'X-User-Email': auth.auth.email,
    'X-User-Id': auth.auth.id,
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
 * Proxy a Next.js POST (JSON) to FastAPI.
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

  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const body = await req.json()
  const res = await fastapi.post(fastapiPath, body, {
    userEmail: auth.auth.email,
    userId: auth.auth.id,
    accessToken: auth.auth.accessToken,
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

  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const body = await req.json()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const combinedSignal = req.signal
    ? AbortSignal.any([req.signal, controller.signal])
    : controller.signal

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getServiceToken()}`,
    'Content-Type': 'application/json',
    'X-User-Email': auth.auth.email,
    'X-User-Id': auth.auth.id,
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
