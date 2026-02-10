import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, AUTH_LIMIT } from '@/lib/rate-limit';
import { registerSchema, parseBody } from '@/lib/validators';
import { hashPassword } from '@/lib/password';
import { signSession, COOKIE_NAME } from '@/lib/session';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, AUTH_LIMIT);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = parseBody(registerSchema, body);
    if (!parsed.ok) return parsed.response;

    const { email, password, firstName, sectors, regions, keywords } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const supabase = getSupabase();

    // Check if user exists
    const { data: existing } = await supabase
      .from('user_settings')
      .select('user_email, password_hash')
      .eq('user_email', normalizedEmail)
      .single();

    if (existing) {
      if (existing.password_hash) {
        // Already registered with password
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cet email. Connectez-vous.' },
          { status: 409 },
        );
      }

      // Existing user without password (meragel migration) — set password
      const hash = await hashPassword(password);
      await supabase
        .from('user_settings')
        .update({
          password_hash: hash,
          first_name: firstName,
          display_name: firstName,
          default_cpv: sectors,
          default_regions: regions,
          default_keywords: keywords,
        })
        .eq('user_email', normalizedEmail);
    } else {
      // New user
      const hash = await hashPassword(password);
      await supabase.from('user_settings').insert({
        user_email: normalizedEmail,
        password_hash: hash,
        first_name: firstName,
        display_name: firstName,
        plan: 'free',
        default_cpv: sectors,
        default_regions: regions,
        default_keywords: keywords,
      });
    }

    // Sign session cookie
    const sessionValue = signSession(normalizedEmail);
    const response = NextResponse.json({ success: true });
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
