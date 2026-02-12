import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { getSupabase } from '@/lib/supabase';
import { rateLimit, AI_LIMIT } from '@/lib/rate-limit';
import { categorizeDocument, isPlatformJunk } from '@/lib/dce-categorize';

const WORKER_URL = process.env.WORKER_URL ?? 'https://lefilonao-workers.olamcreations.workers.dev';
const WORKER_AUTH_TOKEN = process.env.WORKER_AUTH_TOKEN;

interface DiscoveredDoc {
  url: string;
  filename: string;
  size: number | null;
  mimeType: string | null;
}

/**
 * Platforms known to be JavaScript SPAs or require headless browser.
 * Direct HTTP extraction will always fail on these — skip straight to Worker.
 */
const BROWSER_REQUIRED_HOSTNAMES = [
  'marches-publics.info',
  'awsolutions.fr',
  'aw-solutions.fr',
  'achatpublic.com',
  'aws-achat.info',
  'aws-achat.fr',
  'e-marchespublics.com',
  'marches-securises.fr',
  'klekoon.com',
  'dematis.com',
  'local-trust.com',
  'megalisbretagne.org',
  'megalis.bretagne.bzh',
];

/** Check if a URL points to a platform that requires headless browser. */
function requiresBrowser(dceUrl: string): boolean {
  try {
    const hostname = new URL(dceUrl).hostname.toLowerCase();
    return BROWSER_REQUIRED_HOSTNAMES.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

/** Try direct HTTP link extraction from the DCE URL page (no headless browser). */
async function extractLinksDirectly(dceUrl: string): Promise<DiscoveredDoc[]> {
  try {
    const res = await fetch(dceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeFilonAO/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return [];

    const ct = res.headers.get('content-type') ?? '';

    // If the URL directly serves a file (not HTML), return it as a single document
    if (ct.includes('application/pdf') || ct.includes('application/zip') || ct.includes('application/octet-stream')) {
      const filename = dceUrl.split('/').pop()?.split('?')[0] ?? 'document';
      const size = res.headers.get('content-length');
      return [{
        url: dceUrl,
        filename: decodeURIComponent(filename),
        size: size ? parseInt(size, 10) : null,
        mimeType: ct.split(';')[0].trim(),
      }];
    }

    // Parse HTML for document links
    if (!ct.includes('text/html')) return [];

    const html = await res.text();

    // Quick check: if the HTML is a SPA shell (very short, has "enable JavaScript"),
    // don't bother parsing — return empty so Worker takes over
    if (html.length < 2000 && /enable\s+javascript|noscript/i.test(html)) {
      return [];
    }

    const docPattern = /href=["']([^"']+\.(pdf|zip|doc|docx|xls|xlsx|odt|ods)(\?[^"']*)?)["']/gi;
    const docs: DiscoveredDoc[] = [];
    const seen = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = docPattern.exec(html)) !== null) {
      let href = match[1];
      // Resolve relative URLs
      try {
        href = new URL(href, dceUrl).href;
      } catch {
        continue;
      }
      if (seen.has(href)) continue;
      seen.add(href);

      const filename = decodeURIComponent(href.split('/').pop()?.split('?')[0] ?? 'document');
      if (!isPlatformJunk(filename)) {
        docs.push({ url: href, filename, size: null, mimeType: null });
      }
    }

    return docs;
  } catch {
    return [];
  }
}

/** Call the Worker headless browser for document discovery. */
async function discoverViaWorker(
  dceUrl: string,
  userEmail: string,
): Promise<DiscoveredDoc[]> {
  if (!WORKER_AUTH_TOKEN) return [];

  try {
    const workerRes = await fetch(`${WORKER_URL}/discover-dce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WORKER_AUTH_TOKEN}`,
      },
      body: JSON.stringify({ url: dceUrl, user_email: userEmail }),
      signal: AbortSignal.timeout(50_000),
    });

    if (workerRes.ok) {
      const result = await workerRes.json() as { documents: DiscoveredDoc[] };
      return result.documents ?? [];
    }
  } catch {
    // Worker unavailable — continue with empty
  }

  return [];
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, AI_LIMIT);
  if (limited) return limited;

  const authResult = await requireAuth(req);
  if (!authResult.ok) return authResult.response;

  const body = await req.json().catch(() => null);
  const noticeId = body?.notice_id;
  if (!noticeId || typeof noticeId !== 'string') {
    return NextResponse.json({ error: 'notice_id requis' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Check current discovery status
  const { data: notice } = await supabase
    .from('boamp_notices')
    .select('dce_url, dce_discovery_status')
    .eq('id', noticeId)
    .maybeSingle();

  if (!notice) {
    return NextResponse.json({ error: 'Notice non trouvee' }, { status: 404 });
  }

  // If already done, return existing documents
  if (notice.dce_discovery_status === 'done') {
    const { data: docs } = await supabase
      .from('dce_documents')
      .select('*')
      .eq('notice_id', noticeId)
      .order('category');

    return NextResponse.json({
      documents: docs ?? [],
      discovery_status: 'done',
    });
  }

  // If already discovering, return current status
  if (notice.dce_discovery_status === 'discovering') {
    return NextResponse.json({
      documents: [],
      discovery_status: 'discovering',
    });
  }

  const dceUrl = notice.dce_url;
  if (!dceUrl || dceUrl.includes('boamp.fr')) {
    await supabase
      .from('boamp_notices')
      .update({ dce_discovery_status: 'no_url' })
      .eq('id', noticeId);

    return NextResponse.json({
      documents: [],
      discovery_status: 'no_url',
    });
  }

  // Set discovering status
  await supabase
    .from('boamp_notices')
    .update({ dce_discovery_status: 'discovering' })
    .eq('id', noticeId);

  try {
    let discovered: DiscoveredDoc[] = [];

    if (requiresBrowser(dceUrl)) {
      // Known JS-heavy platform — skip direct extraction, go straight to Worker
      discovered = await discoverViaWorker(dceUrl, authResult.auth.email);
    } else {
      // Step 1: Try direct HTTP extraction (fast, works on simple HTML pages)
      discovered = await extractLinksDirectly(dceUrl);

      // Step 2: If direct fails, try Worker headless discovery
      if (discovered.length === 0) {
        discovered = await discoverViaWorker(dceUrl, authResult.auth.email);
      }
    }

    if (discovered.length === 0) {
      await supabase
        .from('boamp_notices')
        .update({ dce_discovery_status: 'done' })
        .eq('id', noticeId);

      return NextResponse.json({
        documents: [],
        discovery_status: 'done',
      });
    }

    // Filter out platform junk (help docs, tutorials, generic platform assets)
    const filtered = discovered.filter((doc) => !isPlatformJunk(doc.filename));

    if (filtered.length === 0) {
      await supabase
        .from('boamp_notices')
        .update({ dce_discovery_status: 'done' })
        .eq('id', noticeId);

      return NextResponse.json({
        documents: [],
        discovery_status: 'done',
      });
    }

    // Categorize and upsert documents
    const rows = filtered.map((doc) => ({
      notice_id: noticeId,
      original_url: doc.url,
      filename: doc.filename,
      file_size: doc.size,
      mime_type: doc.mimeType,
      category: categorizeDocument(doc.filename),
      discovery_status: 'listed',
    }));

    const { error: upsertError } = await supabase
      .from('dce_documents')
      .upsert(rows, { onConflict: 'notice_id,original_url' });

    if (upsertError) {
      await supabase
        .from('boamp_notices')
        .update({ dce_discovery_status: 'failed' })
        .eq('id', noticeId);

      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    await supabase
      .from('boamp_notices')
      .update({ dce_discovery_status: 'done' })
      .eq('id', noticeId);

    // Return the inserted documents
    const { data: docs } = await supabase
      .from('dce_documents')
      .select('*')
      .eq('notice_id', noticeId)
      .order('category');

    return NextResponse.json({
      documents: docs ?? [],
      discovery_status: 'done',
    });
  } catch (err) {
    await supabase
      .from('boamp_notices')
      .update({ dce_discovery_status: 'failed' })
      .eq('id', noticeId);

    const message = err instanceof Error ? err.message : 'Erreur discovery';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
