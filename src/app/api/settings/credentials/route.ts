import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { encrypt } from '@/lib/crypto-utils';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

const VALID_PLATFORMS = ['place', 'maximilien', 'atexo', 'agysoft', 'generic'] as const;
type Platform = (typeof VALID_PLATFORMS)[number];

function isValidPlatform(v: unknown): v is Platform {
  return typeof v === 'string' && VALID_PLATFORMS.includes(v as Platform);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function getMasterKey(): string {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_MASTER_KEY not configured or invalid');
  }
  return key;
}

/** GET: list credentials for current user (never returns passwords) */
export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from('platform_credentials')
      .select('id, platform, platform_url, username, created_at, updated_at')
      .eq('user_email', email)
      .order('platform', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ credentials: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

/** POST: create or update a credential (encrypts password) */
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { platform, platform_url, username, password } = body;

  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: 'Plateforme invalide' }, { status: 400 });
  }
  if (!isNonEmptyString(username)) {
    return NextResponse.json({ error: 'Identifiant requis' }, { status: 400 });
  }
  if (!isNonEmptyString(password)) {
    return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
  }

  try {
    const masterKey = getMasterKey();
    const encrypted = encrypt(password, masterKey);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('platform_credentials')
      .upsert(
        {
          user_email: email,
          platform,
          platform_url: isNonEmptyString(platform_url) ? platform_url : null,
          username,
          encrypted_password: encrypted.ciphertext,
          encrypted_iv: encrypted.iv,
          auth_tag: encrypted.authTag,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_email,platform' },
      )
      .select('id, platform, platform_url, username, created_at, updated_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ credential: data });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

/** DELETE: remove a credential by platform */
export async function DELETE(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const platform = req.nextUrl.searchParams.get('platform');
  if (!platform) {
    return NextResponse.json({ error: 'platform requis' }, { status: 400 });
  }

  const supabase = getSupabase();

  try {
    const { error } = await supabase
      .from('platform_credentials')
      .delete()
      .eq('user_email', email)
      .eq('platform', platform);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
