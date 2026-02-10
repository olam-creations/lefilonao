import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, AUTH_LIMIT } from '@/lib/rate-limit';
import { loginSchema, parseBody } from '@/lib/validators';
import { verifyPassword } from '@/lib/password';
import { signSession, COOKIE_NAME } from '@/lib/session';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, AUTH_LIMIT);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = parseBody(loginSchema, body);
    if (!parsed.ok) return parsed.response;

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Dev bypass — before DB lookup so it works without a real user row
    if (process.env.NODE_ENV === 'development' && normalizedEmail === 'dev@lefilonao.com') {
      const sessionValue = signSession(normalizedEmail);
      const response = NextResponse.json({ success: true, displayName: 'Dev User' });
      response.cookies.set(COOKIE_NAME, sessionValue, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
      return response;
    }

    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('user_settings')
      .select('user_email, password_hash, display_name')
      .eq('user_email', normalizedEmail)
      .single();

    if (!user) {
      // Generic message to prevent email enumeration
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 },
      );
    }

    // User exists but has no password yet (meragel-era account)
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Veuillez créer votre mot de passe', needsMigration: true },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 },
      );
    }

    const sessionValue = signSession(normalizedEmail);
    const response = NextResponse.json({
      success: true,
      displayName: user.display_name || '',
    });
    response.cookies.set(COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
