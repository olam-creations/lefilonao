import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/** Per-IP rate limiter. Returns null if allowed, or a 429 Response if exceeded. */
export function rateLimit(req: NextRequest, options: RateLimitOptions): NextResponse | null {
  cleanup();

  const ip = req.headers.get('x-real-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown';
  const now = Date.now();
  const key = `${ip}:${req.nextUrl.pathname}`;

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowSeconds * 1000 });
    return null;
  }

  entry.count++;
  if (entry.count > options.limit) {
    return NextResponse.json(
      { error: 'Trop de requêtes, veuillez réessayer plus tard' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      },
    );
  }

  return null;
}

/** Preset: standard API routes (60 req/min) */
export const STANDARD_LIMIT: RateLimitOptions = { limit: 60, windowSeconds: 60 };

/** Preset: AI endpoints (10 req/min) */
export const AI_LIMIT: RateLimitOptions = { limit: 10, windowSeconds: 60 };

/** Preset: auth/gate (5 req/min) */
export const AUTH_LIMIT: RateLimitOptions = { limit: 5, windowSeconds: 60 };
