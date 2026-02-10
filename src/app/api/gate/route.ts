import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { rateLimit, AUTH_LIMIT } from '@/lib/rate-limit';

const GATE_COOKIE = 'lefilonao_gate';
const SITE_PASSWORD = (process.env.SITE_PASSWORD || '').trim();

function signGate(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET required');
  const ts = Math.floor(Date.now() / 1000).toString(36);
  const hmac = createHmac('sha256', secret).update(`gate.${ts}`).digest('base64url');
  return `gate.${ts}.${hmac}`;
}

export function verifyGate(cookieValue: string): boolean {
  if (!cookieValue) return false;
  const parts = cookieValue.split('.');
  if (parts.length !== 3 || parts[0] !== 'gate') return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const [, ts, signature] = parts;
  const expected = createHmac('sha256', secret).update(`gate.${ts}`).digest('base64url');

  if (signature !== expected) return false;

  // Check 30-day expiry
  const created = parseInt(ts, 36) * 1000;
  if (isNaN(created) || Date.now() - created > 30 * 24 * 60 * 60 * 1000) return false;

  return true;
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, AUTH_LIMIT);
  if (limited) return limited;

  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
    }

    if (password.trim() !== SITE_PASSWORD) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 403 });
    }

    const gateValue = signGate();
    const response = NextResponse.json({ success: true });
    response.cookies.set(GATE_COOKIE, gateValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
