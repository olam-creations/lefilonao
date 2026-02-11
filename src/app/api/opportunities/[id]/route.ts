import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { noticeToRfp } from '@/lib/notice-transform';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const supabase = getSupabase();
    const [noticeResult, lotsResult] = await Promise.all([
      supabase
        .from('boamp_notices')
        .select('*, dce_analyses(status)')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('boamp_lots')
        .select('lot_number, title, cpv_code, estimated_amount, description')
        .eq('notice_id', id)
        .order('lot_number', { ascending: true }),
    ]);

    if (noticeResult.error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    if (!noticeResult.data) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    const dceAnalysis = (noticeResult.data as Record<string, unknown>).dce_analyses as { status: string } | null;

    return NextResponse.json({
      rfp: noticeToRfp(noticeResult.data),
      notice: noticeResult.data,
      lots: lotsResult.data ?? [],
      analysisStatus: dceAnalysis?.status ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
