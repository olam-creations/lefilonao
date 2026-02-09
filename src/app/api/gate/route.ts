import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
const SITE_PASSWORD = (process.env.SITE_PASSWORD || '').trim();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (password.trim() !== SITE_PASSWORD) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 403 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('lefilonao_access', 'granted', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
