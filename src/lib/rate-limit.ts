import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

// ─── Redis-backed rate limiter (distributed, works across Vercel instances) ───

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
    })
  : null;

const limiters = new Map<string, Ratelimit>();

function getRedisLimiter(options: RateLimitOptions): Ratelimit {
  const key = `${options.limit}:${options.windowSeconds}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(options.limit, `${options.windowSeconds} s`),
      prefix: 'rl',
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// ─── In-memory fallback (dev / missing env vars) ───

interface MemEntry { count: number; resetAt: number }
const memStore = new Map<string, MemEntry>();
let lastCleanup = Date.now();

function memRateLimit(ip: string, pathname: string, options: RateLimitOptions): NextResponse | null {
  const now = Date.now();
  if (now - lastCleanup > 300_000) {
    lastCleanup = now;
    for (const [k, v] of memStore) { if (now > v.resetAt) memStore.delete(k); }
  }
  const key = `${ip}:${pathname}`;
  const entry = memStore.get(key);
  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + options.windowSeconds * 1000 });
    return null;
  }
  entry.count++;
  if (entry.count > options.limit) {
    return NextResponse.json(
      { error: 'Trop de requêtes, veuillez réessayer plus tard' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) } },
    );
  }
  return null;
}

// ─── Public API (same signature as before — all 51 callers unchanged) ───

function getIp(req: NextRequest): string {
  return req.headers.get('x-real-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown';
}

/** Per-IP rate limiter. Returns null if allowed, or a 429 Response if exceeded. */
export async function rateLimit(req: NextRequest, options: RateLimitOptions): Promise<NextResponse | null> {
  const ip = getIp(req);

  if (!redis) {
    return memRateLimit(ip, req.nextUrl.pathname, options);
  }

  const limiter = getRedisLimiter(options);
  const key = `${ip}:${req.nextUrl.pathname}`;
  const { success, reset } = await limiter.limit(key);

  if (!success) {
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Trop de requêtes, veuillez réessayer plus tard' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
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
