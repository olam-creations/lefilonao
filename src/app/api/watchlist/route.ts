import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { watchlistCreateSchema, parseBody } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('user_watchlist')
      .select('*')
      .eq('user_email', email)
      .order('added_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ watchlist: data });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  try {
    const raw = await req.json();
    const parsed = parseBody(watchlistCreateSchema, raw);
    if (!parsed.ok) return NextResponse.json(JSON.parse(await parsed.response.text()), { status: 400 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_watchlist')
      .insert({
        user_email: email,
        ...parsed.data,
      })
      .select()
      .single();

    if (error && error.code === '23505') {
      return NextResponse.json({ error: 'Déjà dans la watchlist' }, { status: 400 });
    }
    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
