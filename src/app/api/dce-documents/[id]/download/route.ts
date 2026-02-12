import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { getSupabase } from '@/lib/supabase';
import { r2Upload, r2Download } from '@/lib/r2-client';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

const WORKER_URL = process.env.WORKER_URL ?? 'https://lefilonao-workers.olamcreations.workers.dev';
const WORKER_AUTH_TOKEN = process.env.WORKER_AUTH_TOKEN;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const authResult = await requireAuth(req);
  if (!authResult.ok) return authResult.response;

  const { id } = await params;

  const supabase = getSupabase();
  const { data: doc, error } = await supabase
    .from('dce_documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !doc) {
    return NextResponse.json({ error: 'Document non trouve' }, { status: 404 });
  }

  // If cached in R2, stream directly
  if (doc.r2_key) {
    const r2File = await r2Download(doc.r2_key);
    if (r2File) {
      return new NextResponse(r2File.body as ReadableStream, {
        headers: {
          'Content-Type': r2File.contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.filename)}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }
  }

  // Not cached — fetch from original URL
  try {
    // Mark as downloading
    await supabase
      .from('dce_documents')
      .update({ discovery_status: 'downloading' })
      .eq('id', id);

    let buffer: ArrayBuffer | null = null;
    let contentType = doc.mime_type ?? 'application/octet-stream';

    // Try direct HTTP fetch first
    try {
      const res = await fetch(doc.original_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeFilonAO/1.0)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        buffer = await res.arrayBuffer();
        const ct = res.headers.get('content-type');
        if (ct) contentType = ct.split(';')[0].trim();
      }
    } catch {
      // Direct fetch failed
    }

    // Fallback: Worker headless download
    if (!buffer && WORKER_AUTH_TOKEN) {
      try {
        const workerRes = await fetch(`${WORKER_URL}/download-dce-doc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WORKER_AUTH_TOKEN}`,
          },
          body: JSON.stringify({ url: doc.original_url }),
          signal: AbortSignal.timeout(45_000),
        });

        if (workerRes.ok) {
          buffer = await workerRes.arrayBuffer();
          const ct = workerRes.headers.get('content-type');
          if (ct) contentType = ct.split(';')[0].trim();
        }
      } catch {
        // Worker unavailable
      }
    }

    if (!buffer || buffer.byteLength === 0) {
      await supabase
        .from('dce_documents')
        .update({ discovery_status: 'failed' })
        .eq('id', id);

      return NextResponse.json({ error: 'Echec du telechargement' }, { status: 502 });
    }

    // Cache in R2
    const r2Key = `dce/${doc.notice_id}/${id}-${doc.filename}`;
    try {
      await r2Upload(r2Key, Buffer.from(buffer), contentType);

      await supabase
        .from('dce_documents')
        .update({
          r2_key: r2Key,
          cached_at: new Date().toISOString(),
          file_size: buffer.byteLength,
          mime_type: contentType,
          discovery_status: 'cached',
        })
        .eq('id', id);
    } catch {
      // R2 cache failed — still serve the file
      await supabase
        .from('dce_documents')
        .update({ discovery_status: 'listed' })
        .eq('id', id);
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.filename)}"`,
      },
    });
  } catch (err) {
    await supabase
      .from('dce_documents')
      .update({ discovery_status: 'failed' })
      .eq('id', id);

    const message = err instanceof Error ? err.message : 'Erreur download';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
