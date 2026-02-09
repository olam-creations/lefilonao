import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const DEFAULTS = {
  display_name: '',
  default_cpv: [] as string[],
  default_regions: [] as string[],
  default_keywords: [] as string[],
  amount_min: 0,
  amount_max: 0,
  plan: 'free',
  created_at: null as string | null,
};

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email as string | undefined;
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const supabase = getSupabase();

  const allowedFields = [
    'display_name',
    'default_cpv',
    'default_regions',
    'default_keywords',
    'amount_min',
    'amount_max',
  ] as const;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
