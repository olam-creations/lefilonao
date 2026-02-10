import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { analyzePdfBuffer } from '@/lib/dce-analyzer';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, AI_LIMIT } from '@/lib/rate-limit';

const FETCH_TIMEOUT = 15_000;
const MAX_RESPONSE_SIZE = 25 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;

    const h = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();

    // Block localhost variants
    if (h === 'localhost' || h === '0.0.0.0') return false;

    // Block private IPv4 ranges, loopback, link-local, metadata
    if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.)/.test(h)) return false;

    // Block IPv6 private/reserved
    if (/^(::1|::ffff:|0{1,4}:|fe80:|fc00:|fd00:)/i.test(h)) return false;

    // Block decimal/hex IP encodings (e.g. 0x7f000001, 2130706433)
    if (/^0x[0-9a-f]+$/i.test(h) || /^\d{8,}$/.test(h)) return false;

    // Block octal IP notation (e.g. 0177.0.0.1)
    if (/^0\d+\./.test(h)) return false;

    return true;
  } catch {
    return false;
  }
}

function sanitizeFallbackUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
    return undefined;
  } catch {
    return undefined;
  }
}

async function fetchWithRedirectValidation(url: string): Promise<Response> {
  let currentUrl = url;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'application/pdf, text/html, */*',
        },
        redirect: 'manual',
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error('Redirection sans destination');

      const resolvedUrl = new URL(location, currentUrl).href;
      if (!isAllowedUrl(resolvedUrl)) {
        throw new Error('Redirection vers une URL non autorisee');
      }

      currentUrl = resolvedUrl;
      continue;
    }

    return res;
  }

  throw new Error('Trop de redirections');
}

function extractPdfLinksFromHtml(html: string): string[] {
  const links: string[] = [];
  const regex = /href=["'](https:\/\/[^"']*\.pdf(?:\?[^"']*)?)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    links.push(match[1]);
  }
  return links;
}

async function fetchPdfAndAnalyze(url: string, fallbackUrl: string | undefined) {
  // Pre-check Content-Length if available
  let response: Response;
  try {
    response = await fetchWithRedirectValidation(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Impossible de joindre le serveur';
    return NextResponse.json(
      { success: false, error: msg, fallback_url: fallbackUrl },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { success: false, error: `Le serveur a repondu ${response.status}`, fallback_url: fallbackUrl },
      { status: 502 },
    );
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_RESPONSE_SIZE) {
    return NextResponse.json(
      { success: false, error: 'Le PDF depasse 25 Mo', fallback_url: fallbackUrl },
      { status: 413 },
    );
  }

  return response;
}

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

    const targetUrl = data?.dce_url;

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Aucune URL de DCE disponible pour cette notice' },
        { status: 400 },
      );
    }

    const fallbackUrl = sanitizeFallbackUrl(targetUrl);

    if (!isAllowedUrl(targetUrl)) {
      return NextResponse.json(
        { success: false, error: 'URL non autorisee (HTTP ou reseau prive)', fallback_url: fallbackUrl },
        { status: 400 },
      );
    }

    // Attempt to fetch the URL
    let response: Response;
    try {
      response = await fetchWithRedirectValidation(targetUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de joindre le serveur du profil acheteur';
      return NextResponse.json(
        { success: false, error: msg, fallback_url: fallbackUrl },
        { status: 502 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Le serveur a repondu ${response.status}`, fallback_url: fallbackUrl },
        { status: 502 },
      );
    }

    const contentType = response.headers.get('content-type') ?? '';

    // Direct PDF
    if (contentType.includes('application/pdf')) {
      const contentLength = Number(response.headers.get('content-length') ?? 0);
      if (contentLength > MAX_RESPONSE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Le PDF depasse 25 Mo', fallback_url: fallbackUrl },
          { status: 413 },
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Le PDF depasse 25 Mo', fallback_url: fallbackUrl },
          { status: 413 },
        );
      }
      const buffer = Buffer.from(arrayBuffer);
      const detail = await analyzePdfBuffer(buffer);
      return NextResponse.json({ success: true, data: detail });
    }

    // HTML page — try to find PDF links
    if (contentType.includes('text/html')) {
      const html = await response.text();
      const pdfLinks = extractPdfLinksFromHtml(html);

      if (pdfLinks.length > 0) {
        const pdfUrl = pdfLinks[0];
        if (isAllowedUrl(pdfUrl)) {
          const pdfResult = await fetchPdfAndAnalyze(pdfUrl, fallbackUrl);
          if (!(pdfResult instanceof NextResponse)) {
            const pdfArrayBuffer = await pdfResult.arrayBuffer();
            if (pdfArrayBuffer.byteLength <= MAX_RESPONSE_SIZE) {
              const pdfBuffer = Buffer.from(pdfArrayBuffer);
              const detail = await analyzePdfBuffer(pdfBuffer);
              return NextResponse.json({ success: true, data: detail });
            }
          }
        }
      }
      // No PDF found in HTML — fall through to Worker scraping
    }

    // Content not a direct PDF and HTML extraction failed — try Worker scraping

    // === Fallback: headless scraping via Cloudflare Worker ===
    const workerUrl = process.env.WORKER_URL;
    const workerToken = process.env.WORKER_AUTH_TOKEN;
    if (workerUrl && workerToken) {
      try {
        const scrapeRes = await fetch(`${workerUrl}/scrape-dce`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${workerToken}`,
          },
          body: JSON.stringify({
            url: targetUrl,
            user_email: auth.auth.email,
          }),
        });

        if (scrapeRes.ok && scrapeRes.headers.get('content-type')?.includes('application/pdf')) {
          const scrapeBuffer = Buffer.from(await scrapeRes.arrayBuffer());
          if (scrapeBuffer.byteLength > 0 && scrapeBuffer.byteLength <= MAX_RESPONSE_SIZE) {
            const detail = await analyzePdfBuffer(scrapeBuffer);
            return NextResponse.json({ success: true, data: detail });
          }
        }
      } catch {
        // Worker scraping failed — fall through to fallback_url
      }
    }

    // All methods exhausted — return fallback URL for manual upload
    return NextResponse.json(
      { success: false, error: 'Impossible de recuperer le PDF automatiquement', fallback_url: fallbackUrl },
      { status: 422 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 },
    );
  }
}
