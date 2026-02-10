import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from './session';

export interface AuthContext {
  email: string;
}

interface TokenPayload {
  sub?: string;
  email?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

function decodePayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1])) as TokenPayload;
  } catch {
    return null;
  }
}

type AuthResult =
  | { ok: true; auth: AuthContext }
  | { ok: false; response: NextResponse };

/** Extract and verify user session from request cookie or Authorization header. Returns email or 401. */
export function requireAuth(req: NextRequest): AuthResult {
  // 1. Try Cookie first
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie) {
    const email = verifySession(cookie);
    if (email) {
      return { ok: true, auth: { email } };
    }
  }

  // 2. Try Authorization Header
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = decodePayload(token);
    
    if (payload?.email) {
      // Check expiry if available
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return {
          ok: false,
          response: NextResponse.json({ error: 'Token expiré' }, { status: 401 }),
        };
      }
      return { ok: true, auth: { email: payload.email } };
    }
  }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
  };
}
