import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { noticeToRfp } from '@/lib/notice-transform';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'email parameter required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_rfps')
      .select('*, boamp_notices(*)')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_email, notice_id } = body;

    if (!user_email || !notice_id) {
      return NextResponse.json({ error: 'user_email and notice_id required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_rfps')
      .upsert(
        { user_email, notice_id },
        { onConflict: 'user_email,notice_id' }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ rfp: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, user_email, notice_id, ...rest } = body;

    if (!id && !(user_email && notice_id)) {
      return NextResponse.json({ error: 'id or (user_email + notice_id) required' }, { status: 400 });
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
      query = query.eq('id', id);
    } else {
      query = query.eq('user_email', user_email).eq('notice_id', notice_id);
    }

    const { data, error } = await query.select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ rfp: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id parameter required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('user_rfps')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
