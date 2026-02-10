import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { pipelineCreateSchema, parseBody } from '@/lib/validators';

// Stages enum: detected, qualified, dce_analyzed, drafting, submitted, result
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('ao_pipeline')
      .select('*')
      .eq('user_email', email)
      .order('position', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ pipeline: data });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email: user_email } = auth.auth;

  try {
    const raw = await req.json();
    const parsed = parseBody(pipelineCreateSchema, raw);
    if (!parsed.ok) return NextResponse.json(JSON.parse(await parsed.response.text()), { status: 400 });
    const { ao_id, ao_title, ao_issuer, ao_budget, ao_deadline, ao_score, ao_score_label } = parsed.data;

    const supabase = getSupabase();
    // Check if already in pipeline
    const { data: existing } = await supabase
      .from('ao_pipeline')
      .select('id')
      .eq('user_email', user_email)
      .eq('ao_id', ao_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Déjà dans le pipeline' }, { status: 400 });
    }

    // Get max position for the stage 'detected'
    const { data: posData } = await supabase
      .from('ao_pipeline')
      .select('position')
      .eq('user_email', user_email)
      .eq('stage', 'detected')
      .order('position', { ascending: false })
      .limit(1);

    const nextPos = posData && posData.length > 0 ? posData[0].position + 1 : 0;

    const { data, error } = await supabase
      .from('ao_pipeline')
      .insert({
        user_email,
        ao_id,
        ao_title,
        ao_issuer,
        ao_budget,
        ao_deadline,
        ao_score,
        ao_score_label,
        stage: 'detected',
        position: nextPos,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
