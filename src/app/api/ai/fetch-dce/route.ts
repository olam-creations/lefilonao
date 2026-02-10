import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, AI_LIMIT } from '@/lib/rate-limit';
import { processSingleDce, type StepLog } from '@/lib/dce-pipeline';

export const maxDuration = 60;

const HARD_DEADLINE_MS = 55_000;

// ─── Response builders ───

function successResponse(data: unknown, logs: StepLog[], resolvedUrl?: string) {
  return NextResponse.json({
    success: true,
    data,
    _debug: { steps: logs, resolvedUrl },
  });
}

function failResponse(
  error: string,
  status: number,
  logs: StepLog[],
  fallbackUrl?: string,
  resolvedUrl?: string,
) {
  return NextResponse.json(
    {
      success: false,
      error,
      fallback_url: fallbackUrl,
      _debug: { steps: logs, resolvedUrl },
    },
    { status },
  );
}

// ─── Main handler ───

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, AI_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { notice_id } = body as { notice_id?: string };

    if (!notice_id) {
      return NextResponse.json(
        { success: false, error: 'notice_id requis' },
        { status: 400 },
      );
    }

    // Resolve URL from notice_id via Supabase
    const supabase = getSupabase();
    const { data } = await supabase
      .from('boamp_notices')
      .select('dce_url')
      .eq('id', notice_id)
      .maybeSingle();

    const rawUrl = data?.dce_url;

    if (!rawUrl) {
      return failResponse('Aucune URL de DCE disponible pour cette notice', 400, []);
    }

    const deadline = Date.now() + HARD_DEADLINE_MS;
    const result = await processSingleDce(notice_id, rawUrl, { deadline });

    if (result.success) {
      return successResponse(result.data, result.logs, result.resolvedUrl);
    }

    return failResponse(
      result.error,
      422,
      result.logs,
      result.fallbackUrl,
      result.resolvedUrl,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Une erreur est survenue';
    return failResponse(message, 500, []);
  }
}
