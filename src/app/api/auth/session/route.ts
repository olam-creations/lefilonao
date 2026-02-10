import { NextRequest, NextResponse } from 'next/server';
import { signSession, COOKIE_NAME } from '@/lib/session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://meragel.vercel.app';

/** Exchange a meragel JWT for an HMAC session cookie. */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the JWT against meragel (if it's valid, meragel returns 200)
    const verifyRes = await fetch(`${API_URL}/api/excalibur/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Extract email from JWT payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Token malformé' }, { status: 401 });
    }

    let email: string | undefined;
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      email = payload.email ?? payload.sub;
    } catch {
      return NextResponse.json({ error: 'Token malformé' }, { status: 401 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email manquant dans le token' }, { status: 401 });
    }

    // Sign and set HMAC session cookie
    const sessionValue = signSession(email);
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
