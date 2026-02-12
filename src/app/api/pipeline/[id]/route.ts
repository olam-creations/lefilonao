import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { pipelineUpdateSchema, parseBody } from '@/lib/validators';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;
  const { id } = await params;

  try {
    const raw = await req.json();
    const parsed = parseBody(pipelineUpdateSchema, raw);
    if (!parsed.ok) return NextResponse.json(JSON.parse(await parsed.response.text()), { status: 400 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('ao_pipeline')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_email', email)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;
  const { id } = await params;
  const supabase = getSupabase();
  try {
    const { error } = await supabase
      .from('ao_pipeline')
      .delete()
      .eq('id', id)
      .eq('user_email', email);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
