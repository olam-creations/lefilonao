import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { processSingleDce } from '@/lib/dce-pipeline';

export const maxDuration = 300;

const PACING_MS = 5_000;
const MAX_RETRIES = 3;
const SAFETY_MARGIN_MS = 30_000;

function verifyAuth(req: NextRequest): boolean {
  // POST: Bearer token from Worker
  const authHeader = req.headers.get('authorization') ?? '';
  const workerToken = process.env.WORKER_AUTH_TOKEN;
  if (workerToken && authHeader === `Bearer ${workerToken}`) return true;

  // GET: Vercel Cron secret
  const cronSecret = req.headers.get('x-vercel-cron-secret') ?? req.headers.get('authorization') ?? '';
  const envCron = process.env.CRON_SECRET;
  if (envCron && cronSecret === envCron) return true;
  if (envCron && cronSecret === `Bearer ${envCron}`) return true;

  // In development, allow unauthenticated
  if (process.env.NODE_ENV === 'development') return true;

  return false;
}

async function runBatch(): Promise<{ processed: number; failed: number; remaining: number }> {
  const functionDeadline = Date.now() + (maxDuration * 1000) - SAFETY_MARGIN_MS;
  const supabase = getSupabase();

  // Find notices needing analysis:
  // 1. Open notices with NO dce_analyses row
  // 2. Failed analyses with retry_count < MAX_RETRIES
  const { data: pendingNotices } = await supabase
    .from('boamp_notices')
    .select('id, dce_url, deadline')
    .eq('is_open', true)
    .not('dce_url', 'is', null)
    .order('deadline', { ascending: true });

  if (!pendingNotices || pendingNotices.length === 0) {
    return { processed: 0, failed: 0, remaining: 0 };
  }

  // Get existing analyses to filter
  const noticeIds = pendingNotices.map((n) => n.id);
  const { data: existingAnalyses } = await supabase
    .from('dce_analyses')
    .select('notice_id, status, retry_count')
    .in('notice_id', noticeIds);

  const analysisMap = new Map(
    (existingAnalyses ?? []).map((a) => [a.notice_id, a]),
  );

  // Build queue: notices without analysis + failed with retries left
  const queue = pendingNotices.filter((n) => {
    const existing = analysisMap.get(n.id);
    if (!existing) return true; // No analysis row yet
    if (existing.status === 'done') return false; // Already done
    if (existing.status === 'failed' && existing.retry_count < MAX_RETRIES) return true; // Retry
    if (existing.status === 'pending') return true; // Stuck in pending
    return false; // fetching/analyzing in progress or max retries
  });

  let processed = 0;
  let failed = 0;

  for (const notice of queue) {
    // Check deadline
    if (Date.now() > functionDeadline) break;

    const existing = analysisMap.get(notice.id);
    const retryCount = existing?.retry_count ?? 0;

    // Upsert status to 'fetching'
    await supabase
      .from('dce_analyses')
      .upsert({
        notice_id: notice.id,
        status: 'fetching',
        updated_at: new Date().toISOString(),
        ...(existing ? {} : { created_at: new Date().toISOString(), retry_count: 0 }),
      }, { onConflict: 'notice_id' });

    const itemDeadline = Math.min(
      Date.now() + 120_000, // 2 min max per item
      functionDeadline,
    );

    try {
      // Update to analyzing
      await supabase
        .from('dce_analyses')
        .update({ status: 'analyzing', updated_at: new Date().toISOString() })
        .eq('notice_id', notice.id);

      const result = await processSingleDce(notice.id, notice.dce_url, {
        skipBrightData: true, // Eco mode: no BrightData in batch
        skipWorker: true, // No Worker calls in batch to save resources
        deadline: itemDeadline,
      });

      if (result.success) {
        await supabase
          .from('dce_analyses')
          .update({
            status: 'done',
            analysis: result.data,
            fetch_method: result.fetchMethod,
            pdf_size_bytes: result.pdfSizeBytes,
            error_message: null,
            analyzed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('notice_id', notice.id);

        processed++;
      } else {
        await supabase
          .from('dce_analyses')
          .update({
            status: 'failed',
            error_message: result.error,
            retry_count: retryCount + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('notice_id', notice.id);

        failed++;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      await supabase
        .from('dce_analyses')
        .update({
          status: 'failed',
          error_message: errorMsg,
          retry_count: retryCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('notice_id', notice.id);

      failed++;
    }

    // Pacing: wait between items to respect Gemini 15 RPM
    if (Date.now() < functionDeadline) {
      await new Promise((resolve) => setTimeout(resolve, PACING_MS));
    }
  }

  const remaining = queue.length - processed - failed;
  return { processed, failed, remaining };
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runBatch();
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runBatch();
  return NextResponse.json(result);
}
