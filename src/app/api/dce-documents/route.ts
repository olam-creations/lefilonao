import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { getSupabase } from '@/lib/supabase';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { isPlatformJunk } from '@/lib/dce-categorize';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const authResult = await requireAuth(req);
  if (!authResult.ok) return authResult.response;

  const noticeId = req.nextUrl.searchParams.get('notice_id');
  if (!noticeId) {
    return NextResponse.json({ error: 'notice_id requis' }, { status: 400 });
  }

  const supabase = getSupabase();

  const [docsResult, noticeResult] = await Promise.all([
    supabase
      .from('dce_documents')
      .select('id, notice_id, original_url, filename, file_size, mime_type, category, r2_key, cached_at, discovery_status, created_at')
      .eq('notice_id', noticeId)
      .order('category', { ascending: true }),
    supabase
      .from('boamp_notices')
      .select('dce_discovery_status')
      .eq('id', noticeId)
      .maybeSingle(),
  ]);

  if (docsResult.error) {
    return NextResponse.json({ error: docsResult.error.message }, { status: 500 });
  }

  // Filter out platform junk that may have been inserted before the filter was added
  const cleanDocs = (docsResult.data ?? []).filter(
    (doc: { filename: string }) => !isPlatformJunk(doc.filename),
  );

  return NextResponse.json({
    documents: cleanDocs,
    discovery_status: noticeResult.data?.dce_discovery_status ?? null,
  });
}
