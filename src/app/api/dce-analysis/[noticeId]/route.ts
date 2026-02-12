import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { getUserPlan } from '@/lib/require-plan';
import { canAccess } from '@/lib/features';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ noticeId: string }> },
) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { noticeId } = await params;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('dce_analyses')
      .select('notice_id, status, analysis, analyzed_at, updated_at')
      .eq('notice_id', noticeId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    // No analysis row — unavailable
    if (!data) {
      return NextResponse.json({ status: 'unavailable' });
    }

    // Processing states
    if (data.status === 'fetching' || data.status === 'analyzing' || data.status === 'pending') {
      return NextResponse.json({ status: 'processing' });
    }

    // Failed
    if (data.status === 'failed') {
      return NextResponse.json({ status: 'unavailable' });
    }

    // Done — check plan for full vs teaser
    const plan = await getUserPlan(auth.auth.email);
    const hasDceAccess = canAccess('dce-analysis', plan);

    if (hasDceAccess) {
      return NextResponse.json({
        status: 'done',
        analysis: data.analysis,
        analyzedAt: data.analyzed_at,
      });
    }

    // Free user: teaser with truncated data
    const analysis = data.analysis as Record<string, unknown> | null;
    const teaser = analysis ? {
      verdict: (analysis.recommendation as Record<string, unknown>)?.verdict ?? null,
      executiveSummary: typeof analysis.executiveSummary === 'string'
        ? analysis.executiveSummary.slice(0, 120) + '...'
        : null,
      criteriaCount: Array.isArray(analysis.selectionCriteria)
        ? (analysis.selectionCriteria as unknown[]).length
        : 0,
    } : null;

    return NextResponse.json({
      status: 'done',
      teaser,
      analyzedAt: data.analyzed_at,
    });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
