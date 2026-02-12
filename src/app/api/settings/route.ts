import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { settingsUpdateSchema, parseBody } from '@/lib/validators';

const DEFAULTS = {
  display_name: '',
  default_cpv: [] as string[],
  default_regions: [] as string[],
  default_keywords: [] as string[],
  amount_min: 0,
  amount_max: 0,
  plan: 'free',
  created_at: null as string | null,
  notify_frequency: 'daily',
  notify_email: true,
  stripe_customer_id: null as string | null,
  stripe_subscription_id: null as string | null,
  stripe_status: 'none',
  current_period_end: null as string | null,
  cancel_at_period_end: false,
};

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_email', email)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ settings: { ...DEFAULTS, user_email: email } });
    }

    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseBody(settingsUpdateSchema, raw);
  if (!parsed.ok) return NextResponse.json(JSON.parse(await parsed.response.text()), { status: 400 });

  const supabase = getSupabase();
  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        { user_email: email, ...updates },
        { onConflict: 'user_email' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
