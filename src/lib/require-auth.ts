import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from './session';

export interface AuthContext {
  email: string;
}

type AuthResult =
  | { ok: true; auth: AuthContext }
  | { ok: false; response: NextResponse };

/** Extract and verify user session from request cookie. Returns email or 401. */
export function requireAuth(req: NextRequest): AuthResult {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie) {
    const email = verifySession(cookie);
    if (email) {
      return { ok: true, auth: { email } };
    }
  }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
  };
}
