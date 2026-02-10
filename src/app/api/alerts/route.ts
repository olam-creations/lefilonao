import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { alertCreateSchema, alertUpdateSchema, parseBody } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    return NextResponse.json({ alerts: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;

  try {
    const raw = await req.json();
    const parsed = parseBody(alertCreateSchema, raw);
    if (!parsed.ok) return NextResponse.json(JSON.parse(await parsed.response.text()), { status: 400 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_alerts')
      .insert({
        user_email: email,
        ...parsed.data,
        active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    return NextResponse.json({ alert: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const rl = await rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;

  try {
    const raw = await req.json();
    const parsed = parseBody(alertUpdateSchema, raw);
    if (!parsed.ok) return NextResponse.json(JSON.parse(await parsed.response.text()), { status: 400 });

    const { id, ...updates } = parsed.data;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_email', email)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    return NextResponse.json({ alert: data });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const rl = await rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id parameter required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('user_alerts')
      .delete()
      .eq('id', id)
      .eq('user_email', email);

    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
