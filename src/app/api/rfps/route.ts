import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { noticeToRfp } from '@/lib/notice-transform';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_rfps')
      .select('*, boamp_notices(*)')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    const rfps = (data ?? []).map((row) => {
      const notice = row.boamp_notices;
      if (!notice) return null;
      return noticeToRfp(notice, {
        score: row.score,
        score_label: row.score_label,
      });
    }).filter(Boolean);

    return NextResponse.json({ rfps });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;

  try {
    const body = await req.json();
    const { notice_id } = body;

    if (!notice_id) {
      return NextResponse.json({ error: 'notice_id required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_rfps')
      .upsert(
        { user_email: email, notice_id },
        { onConflict: 'user_email,notice_id' }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    return NextResponse.json({ rfp: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const rl = rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;

  try {
    const body = await req.json();
    const { id, notice_id, ...rest } = body;

    if (!id && !notice_id) {
      return NextResponse.json({ error: 'id or notice_id required' }, { status: 400 });
    }

    const allowedFields = ['score', 'score_label', 'status', 'notes'] as const;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (field in rest) {
        updates[field] = rest[field];
      }
    }

    const supabase = getSupabase();
    let query = supabase.from('user_rfps').update(updates);

    if (id) {
      query = query.eq('id', id).eq('user_email', email);
    } else {
      query = query.eq('user_email', email).eq('notice_id', notice_id);
    }

    const { data, error } = await query.select().single();

    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    return NextResponse.json({ rfp: data });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const rl = rateLimit(req, STANDARD_LIMIT);
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
      .from('user_rfps')
      .delete()
      .eq('id', id)
      .eq('user_email', email);

    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
