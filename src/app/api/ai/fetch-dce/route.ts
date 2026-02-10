import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { analyzePdfBuffer } from '@/lib/dce-analyzer';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, AI_LIMIT } from '@/lib/rate-limit';
import { fetchPdfViaBrightData, discoverDceDocuments } from '@/lib/brightdata';

export const maxDuration = 300;

const FETCH_TIMEOUT = 15_000;
// Safety margin: return a proper JSON error before Vercel kills the function
const HARD_DEADLINE_MS = 280_000;
const MAX_RESPONSE_SIZE = 25 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const BOAMP_API_BASE = 'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records';

// ─── Structured Logging ───

interface StepLog {
  step: string;
  status: 'success' | 'skip' | 'fail';
  detail?: string;
  durationMs?: number;
  url?: string;
}

function logStep(
  logs: StepLog[],
  step: string,
  status: StepLog['status'],
  detail?: string,
  extra?: Partial<StepLog>,
): void {
  logs.push({ step, status, detail, ...extra });
}

// ─── URL helpers ───

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

    const h = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();

    if (h === 'localhost' || h === '0.0.0.0') return false;
    if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.)/.test(h)) return false;
    if (/^(::1|::ffff:|0{1,4}:|fe80:|fc00:|fd00:)/i.test(h)) return false;
    if (/^0x[0-9a-f]+$/i.test(h) || /^\d{8,}$/.test(h)) return false;
    if (/^0\d+\./.test(h)) return false;

    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
      return parsed.href;
    }
    return url;
  } catch {
    return url;
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

function isBoampNoticeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('boamp.fr') && parsed.pathname.includes('/avis');
  } catch {
    return false;
  }
}

function extractBoampIdFromUrl(url: string): string | null {
  const match = url.match(/idweb[=:]([A-Z0-9-]+)/i);
  return match ? match[1] : null;
}

// ─── BOAMP API resolution ───

// Known procurement platform domains — scored by specificity
const PLATFORM_DOMAINS: [RegExp, number][] = [
  // Direct consultation/DCE links (highest priority)
  [/consultation|DCE|demat|detail\.do|PCSLID|IDM=/i, 10],
  // Major French procurement platforms
  [/marches-publics\.gouv\.fr/i, 5],
  [/marches-publics\.info/i, 5],
  [/achatpublic\.com/i, 5],
  [/maximilien\.fr/i, 5],
  [/marches-securises\.fr/i, 5],
  [/e-marchespublics\.com/i, 5],
  [/aws-achat\.fr/i, 5],
  [/megalisbretagne\.org/i, 5],
  [/klekoon\.com/i, 5],
  [/ternum/i, 4],
  [/marchespublics/i, 4],
  [/profil-acheteur/i, 4],
];

// Domains to exclude (government sites, tribunals, generic websites)
const EXCLUDE_PATTERNS = [
  /tribunal-administratif/i,
  /legifrance/i,
  /service-public\.fr/i,
  /gouv\.fr(?!.*marches)/i, // gouv.fr but NOT marches-publics.gouv.fr
  /wikipedia/i,
  /boamp\.fr/i,
];

function scorePlatformUrl(url: string): number {
  let score = 0;
  for (const [pattern, points] of PLATFORM_DOMAINS) {
    if (pattern.test(url)) score += points;
  }
  // Exclusions only apply when no platform pattern matched
  if (score === 0 && EXCLUDE_PATTERNS.some((p) => p.test(url))) return -1;
  return score;
}

async function resolveBoampProfilUrl(noticeId: string): Promise<string | null> {
  const apiUrl = `${BOAMP_API_BASE}?where=idweb='${encodeURIComponent(noticeId)}'&limit=1`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(apiUrl, { signal: controller.signal });
    if (!res.ok) return null;

    const json = await res.json();
    const records = json?.results ?? [];
    if (records.length === 0) return null;

    const record = records[0];
    const donnees = record?.donnees;

    // Priority 1: FNSimple urlProfilAch (legacy format)
    const profilUrl = donnees?.FNSimple?.initial?.communication?.urlProfilAch;
    if (profilUrl && typeof profilUrl === 'string' && profilUrl.startsWith('http')) {
      return profilUrl;
    }

    // Priority 2: Extract ALL URLs from donnees and score them
    const donneesStr = typeof donnees === 'string' ? donnees : JSON.stringify(donnees ?? '');

    // Decode HTML entities first (&amp; → &)
    const decoded = donneesStr.replace(/&amp;/g, '&');
    const urlMatches = decoded.match(/https?:\/\/[^"\\,}\s\]]+/g) ?? [];
    const unique = [...new Set(urlMatches)];

    // Score and sort
    const scored = unique
      .map((u) => ({ url: u, score: scorePlatformUrl(u) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      return scored[0].url;
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Fetch helpers ───

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

// Generic guide PDFs that are NOT actual DCE documents
const GENERIC_PDF_PATTERNS = /depot-pli|aide-en-ligne|mode-?emploi|guide-utilisat|faq|charte-graphique|cgu|cgv|mentions-legales/i;

function extractPdfLinksFromHtml(html: string): string[] {
  const links: string[] = [];

  const pdfRegex = /href=["'](https?:\/\/[^"']*\.pdf(?:\?[^"']*)?)["']/gi;
  let match;
  while ((match = pdfRegex.exec(html)) !== null) {
    if (!GENERIC_PDF_PATTERNS.test(match[1])) {
      links.push(match[1]);
    }
  }

  const downloadRegex = /href=["'](https?:\/\/[^"']*(?:download|telecharger|document|dce|piece|fichier|getFile|attachment)[^"']*)["']/gi;
  while ((match = downloadRegex.exec(html)) !== null) {
    if (!links.includes(match[1]) && !GENERIC_PDF_PATTERNS.test(match[1])) {
      links.push(match[1]);
    }
  }

  return links;
}

function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.byteLength > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
}

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

// ─── Analyze with deadline guard ───

class DeadlineExceeded extends Error {
  constructor() { super('Deadline exceeded'); this.name = 'DeadlineExceeded'; }
}

async function analyzeWithDeadline(
  buffer: Buffer,
  deadline: number,
  logs: StepLog[],
  stepName: string,
  url?: string,
): Promise<{ ok: true; detail: unknown } | { ok: false; analysisError: true }> {
  if (Date.now() > deadline) {
    logStep(logs, stepName, 'fail', 'Deadline depassee avant analyse', { url });
    throw new DeadlineExceeded();
  }
  try {
    const detail = await analyzePdfBuffer(buffer);
    return { ok: true, detail };
  } catch (err) {
    logStep(logs, stepName, 'fail', err instanceof Error ? err.message : 'Analyse echouee', { url });
    return { ok: false, analysisError: true };
  }
}

// ─── Main handler ───

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, AI_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const logs: StepLog[] = [];
  const t0 = Date.now();
  const deadline = t0 + HARD_DEADLINE_MS;

  function isNearDeadline(): boolean {
    return Date.now() > deadline;
  }

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
      logStep(logs, 'db_lookup', 'fail', 'Aucune dce_url pour cette notice');
      return failResponse('Aucune URL de DCE disponible pour cette notice', 400, logs);
    }

    logStep(logs, 'db_lookup', 'success', rawUrl);

    // === Step 0: BOAMP URL resolution ===
    let targetUrl = normalizeUrl(rawUrl);
    const fallbackUrl = sanitizeFallbackUrl(rawUrl);
    let resolvedFromBoamp = false;
    let pdfFoundButAnalysisFailed = false;

    if (isBoampNoticeUrl(rawUrl)) {
      const t1 = Date.now();
      const boampId = extractBoampIdFromUrl(rawUrl) ?? notice_id;
      logStep(logs, 'step0_boamp_detect', 'success', `BOAMP notice detected, id=${boampId}`);

      const profilUrl = await resolveBoampProfilUrl(boampId);
      const dur = Date.now() - t1;

      if (profilUrl && isAllowedUrl(profilUrl)) {
        targetUrl = normalizeUrl(profilUrl);
        resolvedFromBoamp = true;
        logStep(logs, 'step0_boamp_resolve', 'success', targetUrl, { durationMs: dur, url: profilUrl });
      } else {
        logStep(logs, 'step0_boamp_resolve', 'fail', profilUrl ? `URL non autorisee: ${profilUrl}` : 'Aucun profil acheteur dans BOAMP API', { durationMs: dur });
      }
    } else {
      logStep(logs, 'step0_boamp_detect', 'skip', 'URL is not a BOAMP notice page');
    }

    if (!isAllowedUrl(targetUrl)) {
      logStep(logs, 'url_validation', 'fail', 'URL non autorisee (reseau prive)');
      return failResponse('URL non autorisee (reseau prive)', 400, logs, fallbackUrl);
    }

    logStep(logs, 'url_resolved', 'success', targetUrl, { url: targetUrl });

    // === Step 1: Direct HTTP fetch with redirect following ===
    let directHtml: string | null = null;
    const t1 = Date.now();
    try {
      const response = await fetchWithRedirectValidation(targetUrl);
      const dur = Date.now() - t1;

      if (response.ok) {
        const contentType = response.headers.get('content-type') ?? '';

        if (contentType.includes('application/pdf')) {
          const contentLength = Number(response.headers.get('content-length') ?? 0);
          if (contentLength > MAX_RESPONSE_SIZE) {
            logStep(logs, 'step1_direct', 'fail', `PDF trop gros: ${contentLength}`, { durationMs: dur });
            return failResponse('Le PDF depasse 25 Mo', 413, logs, fallbackUrl, targetUrl);
          }

          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
            logStep(logs, 'step1_direct', 'fail', `PDF trop gros: ${arrayBuffer.byteLength}`, { durationMs: dur });
            return failResponse('Le PDF depasse 25 Mo', 413, logs, fallbackUrl, targetUrl);
          }
          const buffer = Buffer.from(arrayBuffer);
          logStep(logs, 'step1_direct', 'success', `PDF direct, ${buffer.byteLength} octets`, { durationMs: dur });
          const r1 = await analyzeWithDeadline(buffer, deadline, logs, 'step1_analyze', targetUrl);
          if (r1.ok) return successResponse(r1.detail, logs, targetUrl);
          pdfFoundButAnalysisFailed = true;
        }

        if (!contentType.includes('text/html')) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (isPdfBuffer(buffer) && buffer.byteLength <= MAX_RESPONSE_SIZE) {
            logStep(logs, 'step1_direct', 'success', `PDF (magic bytes, ct=${contentType}), ${buffer.byteLength} octets`, { durationMs: dur });
            const r1b = await analyzeWithDeadline(buffer, deadline, logs, 'step1_analyze', targetUrl);
            if (r1b.ok) return successResponse(r1b.detail, logs, targetUrl);
            pdfFoundButAnalysisFailed = true;
          }
          logStep(logs, 'step1_direct', 'fail', `Non-PDF, ct=${contentType}, ${buffer.byteLength} octets`, { durationMs: dur });
        }

        if (contentType.includes('text/html')) {
          directHtml = await response.text();
          logStep(logs, 'step1_direct', 'skip', `HTML ${directHtml.length} chars, fallthrough`, { durationMs: dur });
        }
      } else {
        logStep(logs, 'step1_direct', 'fail', `HTTP ${response.status}`, { durationMs: dur });
      }
    } catch (err) {
      const dur = Date.now() - t1;
      logStep(logs, 'step1_direct', 'fail', err instanceof Error ? err.message : 'Erreur reseau', { durationMs: dur });
    }

    // === Step 2: Extract PDF links from HTML ===
    if (directHtml) {
      const pdfLinks = extractPdfLinksFromHtml(directHtml);
      logStep(logs, 'step2_html_extract', pdfLinks.length > 0 ? 'success' : 'skip', `${pdfLinks.length} liens trouves`);

      for (const pdfUrl of pdfLinks.slice(0, 3)) {
        if (!isAllowedUrl(pdfUrl)) {
          logStep(logs, 'step2_pdf_fetch', 'skip', `URL non autorisee: ${pdfUrl}`);
          continue;
        }
        const t2 = Date.now();
        try {
          const pdfResponse = await fetchWithRedirectValidation(normalizeUrl(pdfUrl));
          const dur = Date.now() - t2;
          if (!pdfResponse.ok) {
            logStep(logs, 'step2_pdf_fetch', 'fail', `HTTP ${pdfResponse.status}`, { durationMs: dur, url: pdfUrl });
            continue;
          }

          const pdfArrayBuffer = await pdfResponse.arrayBuffer();
          if (pdfArrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
            logStep(logs, 'step2_pdf_fetch', 'fail', 'Trop gros', { durationMs: dur, url: pdfUrl });
            continue;
          }

          const pdfBuffer = Buffer.from(pdfArrayBuffer);
          if (isPdfBuffer(pdfBuffer) || pdfResponse.headers.get('content-type')?.includes('application/pdf')) {
            logStep(logs, 'step2_pdf_fetch', 'success', `PDF ${pdfBuffer.byteLength} octets`, { durationMs: dur, url: pdfUrl });
            const r2 = await analyzeWithDeadline(pdfBuffer, deadline, logs, 'step2_analyze', pdfUrl);
            if (r2.ok) return successResponse(r2.detail, logs, targetUrl);
            pdfFoundButAnalysisFailed = true;
            continue;
          }
          logStep(logs, 'step2_pdf_fetch', 'fail', 'Pas un PDF', { durationMs: dur, url: pdfUrl });
        } catch (err) {
          logStep(logs, 'step2_pdf_fetch', 'fail', err instanceof Error ? err.message : 'Erreur', { durationMs: Date.now() - t2, url: pdfUrl });
        }
      }
    }

    // === Step 2.5: Bright Data rendered HTML + AI document discovery ===
    const t25 = Date.now();
    try {
      const docs = await discoverDceDocuments(targetUrl);
      const dur = Date.now() - t25;

      if (docs && docs.length > 0) {
        logStep(logs, 'step2.5_discover', 'success', `${docs.length} documents trouves`, { durationMs: dur });

        const pdfPromises = docs.slice(0, 5).map((doc) => fetchPdfViaBrightData(doc.url));
        const pdfResults = await Promise.allSettled(pdfPromises);

        for (let i = 0; i < pdfResults.length; i++) {
          const result = pdfResults[i];
          const docUrl = docs[i]?.url ?? '?';
          if (result.status !== 'fulfilled' || !result.value) {
            logStep(logs, 'step2.5_pdf_fetch', 'fail', result.status === 'rejected' ? String(result.reason) : 'null', { url: docUrl });
            continue;
          }
          const buf = result.value;
          if (isPdfBuffer(buf)) {
            logStep(logs, 'step2.5_pdf_fetch', 'success', `PDF ${buf.byteLength} octets`, { url: docUrl });
            const r25 = await analyzeWithDeadline(buf, deadline, logs, 'step2.5_analyze', docUrl);
            if (r25.ok) return successResponse(r25.detail, logs, targetUrl);
            pdfFoundButAnalysisFailed = true;
            continue;
          }
          logStep(logs, 'step2.5_pdf_fetch', 'fail', 'Pas un PDF', { url: docUrl });
        }
      } else {
        logStep(logs, 'step2.5_discover', 'skip', docs ? '0 documents' : 'Service indisponible', { durationMs: dur });
      }
    } catch (err) {
      logStep(logs, 'step2.5_discover', 'fail', err instanceof Error ? err.message : 'Erreur', { durationMs: Date.now() - t25 });
    }

    // === Step 3: Bright Data Web Unlocker raw ===
    const t3 = Date.now();
    try {
      const brightDataBuffer = await fetchPdfViaBrightData(targetUrl);
      const dur = Date.now() - t3;
      if (brightDataBuffer && brightDataBuffer.byteLength > 0) {
        if (isPdfBuffer(brightDataBuffer)) {
          logStep(logs, 'step3_bd_raw', 'success', `PDF ${brightDataBuffer.byteLength} octets`, { durationMs: dur });
          const r3 = await analyzeWithDeadline(brightDataBuffer, deadline, logs, 'step3_analyze', targetUrl);
          if (r3.ok) return successResponse(r3.detail, logs, targetUrl);
          pdfFoundButAnalysisFailed = true;
        } else {
          logStep(logs, 'step3_bd_raw', 'fail', `Pas un PDF (${brightDataBuffer.byteLength} octets)`, { durationMs: dur });
        }
      } else {
        logStep(logs, 'step3_bd_raw', 'fail', 'Reponse vide ou null', { durationMs: dur });
      }
    } catch (err) {
      logStep(logs, 'step3_bd_raw', 'fail', err instanceof Error ? err.message : 'Erreur', { durationMs: Date.now() - t3 });
    }

    // === Step 4: Headless scraping via Cloudflare Worker ===
    const workerUrl = process.env.WORKER_URL;
    const workerToken = process.env.WORKER_AUTH_TOKEN;
    if (workerUrl && workerToken) {
      const t4 = Date.now();
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
        const dur = Date.now() - t4;

        if (scrapeRes.ok && scrapeRes.headers.get('content-type')?.includes('application/pdf')) {
          const scrapeBuffer = Buffer.from(await scrapeRes.arrayBuffer());
          if (scrapeBuffer.byteLength > 0 && scrapeBuffer.byteLength <= MAX_RESPONSE_SIZE) {
            logStep(logs, 'step4_worker', 'success', `PDF ${scrapeBuffer.byteLength} octets`, { durationMs: dur });
            const r4 = await analyzeWithDeadline(scrapeBuffer, deadline, logs, 'step4_analyze', targetUrl);
            if (r4.ok) return successResponse(r4.detail, logs, targetUrl);
            pdfFoundButAnalysisFailed = true;
          }
          logStep(logs, 'step4_worker', 'fail', `Taille invalide: ${scrapeBuffer.byteLength}`, { durationMs: dur });
        } else {
          const ct = scrapeRes.headers.get('content-type') ?? 'none';
          logStep(logs, 'step4_worker', 'fail', `HTTP ${scrapeRes.status}, ct=${ct}`, { durationMs: dur });
        }
      } catch (err) {
        logStep(logs, 'step4_worker', 'fail', err instanceof Error ? err.message : 'Erreur', { durationMs: Date.now() - t4 });
      }
    } else {
      logStep(logs, 'step4_worker', 'skip', 'WORKER_URL ou WORKER_AUTH_TOKEN non configure');
    }

    // === Step 5 (BOAMP fallback): If BOAMP was resolved but chain failed, try original BOAMP URL too ===
    if (resolvedFromBoamp) {
      const boampTargetUrl = normalizeUrl(rawUrl);
      logStep(logs, 'step5_boamp_fallback', 'skip', `Chaine echouee sur profil acheteur, URL BOAMP originale: ${boampTargetUrl}`);
    }

    // All methods exhausted
    const totalMs = Date.now() - t0;
    logStep(logs, 'exhausted', 'fail', `Toutes les methodes echouees en ${totalMs}ms`);

    const errorMsg = pdfFoundButAnalysisFailed
      ? 'PDF trouve mais l\'analyse IA a echoue. Verifiez les cles API ou uploadez manuellement.'
      : 'Impossible de recuperer le PDF automatiquement';

    return failResponse(
      errorMsg,
      422,
      logs,
      fallbackUrl,
      targetUrl,
    );
  } catch (err) {
    if (err instanceof DeadlineExceeded) {
      logStep(logs, 'deadline', 'fail', `Timeout interne apres ${Date.now() - t0}ms`);
      return failResponse(
        'L\'analyse a depasse le temps imparti. Essayez d\'uploader le PDF manuellement.',
        504,
        logs,
      );
    }
    logStep(logs, 'fatal', 'fail', err instanceof Error ? err.message : 'Erreur interne');
    return failResponse('Une erreur est survenue', 500, logs);
  }
}
