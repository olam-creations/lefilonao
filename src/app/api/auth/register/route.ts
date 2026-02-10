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

    const {
      email, password, firstName, sectors, regions, keywords,
      siret, siren, nafCode, nafLabel, companyName,
      companyAddress, companyCity, companyPostalCode, companyDepartment,
    } = parsed.data;
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
      const updateData: Record<string, unknown> = {
        password_hash: hash,
        first_name: firstName,
        display_name: firstName,
        default_cpv: sectors,
        default_regions: regions,
        default_keywords: keywords,
      };
      // SIRET onboarding fields
      if (siret) updateData.siret = siret;
      if (siren) updateData.siren = siren;
      if (nafCode) updateData.naf_code = nafCode;
      if (nafLabel) updateData.naf_label = nafLabel;
      if (companyName) updateData.company = companyName;
      if (companyAddress) updateData.company_address = companyAddress;
      if (companyCity) updateData.company_city = companyCity;
      if (companyPostalCode) updateData.company_postal_code = companyPostalCode;
      if (companyDepartment) updateData.company_department = companyDepartment;

      await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_email', normalizedEmail);
    } else {
      // New user
      const hash = await hashPassword(password);
      const insertData: Record<string, unknown> = {
        user_email: normalizedEmail,
        password_hash: hash,
        first_name: firstName,
        display_name: firstName,
        plan: 'free',
        default_cpv: sectors,
        default_regions: regions,
        default_keywords: keywords,
      };
      // SIRET onboarding fields
      if (siret) insertData.siret = siret;
      if (siren) insertData.siren = siren;
      if (nafCode) insertData.naf_code = nafCode;
      if (nafLabel) insertData.naf_label = nafLabel;
      if (companyName) insertData.company = companyName;
      if (companyAddress) insertData.company_address = companyAddress;
      if (companyCity) insertData.company_city = companyCity;
      if (companyPostalCode) insertData.company_postal_code = companyPostalCode;
      if (companyDepartment) insertData.company_department = companyDepartment;

      await supabase.from('user_settings').insert(insertData);
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
