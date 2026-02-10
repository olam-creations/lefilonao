import { analyzePdfBuffer } from '@/lib/dce-analyzer';
import { fetchPdfViaBrightData, discoverDceDocuments } from '@/lib/brightdata';
import type { AoDetail } from '@/lib/dev';

const FETCH_TIMEOUT = 15_000;
const MAX_RESPONSE_SIZE = 25 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const BOAMP_API_BASE = 'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records';

// ─── Types ───

export interface StepLog {
  step: string;
  status: 'success' | 'skip' | 'fail';
  detail?: string;
  durationMs?: number;
  url?: string;
}

export interface DcePipelineResult {
  success: true;
  data: AoDetail;
  fetchMethod: string;
  pdfSizeBytes: number;
  logs: StepLog[];
  resolvedUrl?: string;
}

export interface DcePipelineError {
  success: false;
  error: string;
  fallbackUrl?: string;
  logs: StepLog[];
  resolvedUrl?: string;
}

export interface DcePipelineOptions {
  skipBrightData?: boolean;
  skipWorker?: boolean;
  deadline?: number;
}

// ─── Logging ───

export function logStep(
  logs: StepLog[],
  step: string,
  status: StepLog['status'],
  detail?: string,
  extra?: Partial<StepLog>,
): void {
  logs.push({ step, status, detail, ...extra });
}

// ─── URL helpers (exported for route reuse) ───

export function isAllowedUrl(url: string): boolean {
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

export function normalizeUrl(url: string): string {
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

export function sanitizeFallbackUrl(url: string): string | undefined {
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

// ─── Platform scoring ───

const PLATFORM_DOMAINS: [RegExp, number][] = [
  [/consultation|DCE|demat|detail\.do|PCSLID|IDM=/i, 10],
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

const EXCLUDE_PATTERNS = [
  /tribunal-administratif/i,
  /legifrance/i,
  /service-public\.fr/i,
  /gouv\.fr(?!.*marches)/i,
  /wikipedia/i,
  /boamp\.fr/i,
];

function scorePlatformUrl(url: string): number {
  let score = 0;
  for (const [pattern, points] of PLATFORM_DOMAINS) {
    if (pattern.test(url)) score += points;
  }
  if (score === 0 && EXCLUDE_PATTERNS.some((p) => p.test(url))) return -1;
  return score;
}

// ─── BOAMP API resolution ───

export async function resolveBoampProfilUrl(noticeId: string): Promise<string | null> {
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

    const profilUrl = donnees?.FNSimple?.initial?.communication?.urlProfilAch;
    if (profilUrl && typeof profilUrl === 'string' && profilUrl.startsWith('http')) {
      return profilUrl;
    }

    const donneesStr = typeof donnees === 'string' ? donnees : JSON.stringify(donnees ?? '');
    const decoded = donneesStr.replace(/&amp;/g, '&');
    const urlMatches = decoded.match(/https?:\/\/[^"\\,}\s\]]+/g) ?? [];
    const unique = [...new Set(urlMatches)];

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

export async function fetchWithRedirectValidation(url: string): Promise<Response> {
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

const GENERIC_PDF_PATTERNS = /depot-pli|aide-en-ligne|mode-?emploi|guide-utilisat|faq|charte-graphique|cgu|cgv|mentions-legales/i;

export function extractPdfLinksFromHtml(html: string): string[] {
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

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.byteLength > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
}

// ─── Main pipeline ───

/**
 * Fetch + analyze a single DCE document. Reusable from both the interactive route
 * and the batch processing endpoint.
 */
export async function processSingleDce(
  noticeId: string,
  dceUrl: string,
  options: DcePipelineOptions = {},
): Promise<DcePipelineResult | DcePipelineError> {
  const { skipBrightData = false, skipWorker = false, deadline = Date.now() + 270_000 } = options;
  const logs: StepLog[] = [];
  let pdfFoundButAnalysisFailed = false;

  function isNearDeadline(): boolean {
    return Date.now() > deadline;
  }

  // --- Step 0: BOAMP URL resolution ---
  let targetUrl = normalizeUrl(dceUrl);
  const fallbackUrl = sanitizeFallbackUrl(dceUrl);
  let resolvedFromBoamp = false;

  if (isBoampNoticeUrl(dceUrl)) {
    const t0 = Date.now();
    const boampId = extractBoampIdFromUrl(dceUrl) ?? noticeId;
    logStep(logs, 'step0_boamp_detect', 'success', `BOAMP notice detected, id=${boampId}`);

    const profilUrl = await resolveBoampProfilUrl(boampId);
    const dur = Date.now() - t0;

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
    return { success: false, error: 'URL non autorisee (reseau prive)', logs, fallbackUrl };
  }

  logStep(logs, 'url_resolved', 'success', targetUrl, { url: targetUrl });

  // Helper: analyze buffer with deadline check
  async function tryAnalyze(
    buffer: Buffer,
    stepName: string,
    fetchMethod: string,
    url?: string,
  ): Promise<DcePipelineResult | null> {
    if (isNearDeadline()) {
      logStep(logs, stepName, 'fail', 'Deadline depassee avant analyse', { url });
      return null;
    }
    try {
      const data = await analyzePdfBuffer(buffer);
      return {
        success: true,
        data,
        fetchMethod,
        pdfSizeBytes: buffer.byteLength,
        logs,
        resolvedUrl: targetUrl,
      };
    } catch (err) {
      logStep(logs, stepName, 'fail', err instanceof Error ? err.message : 'Analyse echouee', { url });
      pdfFoundButAnalysisFailed = true;
      return null;
    }
  }

  // --- Step 1: Direct HTTP fetch ---
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
        } else {
          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer.byteLength <= MAX_RESPONSE_SIZE) {
            const buffer = Buffer.from(arrayBuffer);
            logStep(logs, 'step1_direct', 'success', `PDF direct, ${buffer.byteLength} octets`, { durationMs: dur });
            const r1 = await tryAnalyze(buffer, 'step1_analyze', 'direct_pdf', targetUrl);
            if (r1) return r1;
          }
        }
      }

      if (!contentType.includes('text/html')) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (isPdfBuffer(buffer) && buffer.byteLength <= MAX_RESPONSE_SIZE) {
          logStep(logs, 'step1_direct', 'success', `PDF (magic bytes, ct=${contentType}), ${buffer.byteLength} octets`, { durationMs: dur });
          const r1b = await tryAnalyze(buffer, 'step1_analyze', 'direct_magic', targetUrl);
          if (r1b) return r1b;
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

  // --- Step 2: Extract PDF links from HTML ---
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
          const r2 = await tryAnalyze(pdfBuffer, 'step2_analyze', 'html_extract', pdfUrl);
          if (r2) return r2;
          continue;
        }
        logStep(logs, 'step2_pdf_fetch', 'fail', 'Pas un PDF', { durationMs: dur, url: pdfUrl });
      } catch (err) {
        logStep(logs, 'step2_pdf_fetch', 'fail', err instanceof Error ? err.message : 'Erreur', { durationMs: Date.now() - t2, url: pdfUrl });
      }
    }
  }

  // --- Step 2.5: Bright Data AI document discovery ---
  if (!skipBrightData) {
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
            const r25 = await tryAnalyze(buf, 'step2.5_analyze', 'brightdata_discover', docUrl);
            if (r25) return r25;
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

    // --- Step 3: Bright Data Web Unlocker raw ---
    const t3 = Date.now();
    try {
      const brightDataBuffer = await fetchPdfViaBrightData(targetUrl);
      const dur = Date.now() - t3;
      if (brightDataBuffer && brightDataBuffer.byteLength > 0) {
        if (isPdfBuffer(brightDataBuffer)) {
          logStep(logs, 'step3_bd_raw', 'success', `PDF ${brightDataBuffer.byteLength} octets`, { durationMs: dur });
          const r3 = await tryAnalyze(brightDataBuffer, 'step3_analyze', 'brightdata_raw', targetUrl);
          if (r3) return r3;
        } else {
          logStep(logs, 'step3_bd_raw', 'fail', `Pas un PDF (${brightDataBuffer.byteLength} octets)`, { durationMs: dur });
        }
      } else {
        logStep(logs, 'step3_bd_raw', 'fail', 'Reponse vide ou null', { durationMs: dur });
      }
    } catch (err) {
      logStep(logs, 'step3_bd_raw', 'fail', err instanceof Error ? err.message : 'Erreur', { durationMs: Date.now() - t3 });
    }
  } else {
    logStep(logs, 'step2.5_discover', 'skip', 'BrightData skipped (batch mode)');
    logStep(logs, 'step3_bd_raw', 'skip', 'BrightData skipped (batch mode)');
  }

  // --- Step 4: Cloudflare Worker headless scraping ---
  if (!skipWorker) {
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
          body: JSON.stringify({ url: targetUrl }),
        });
        const dur = Date.now() - t4;

        if (scrapeRes.ok && scrapeRes.headers.get('content-type')?.includes('application/pdf')) {
          const scrapeBuffer = Buffer.from(await scrapeRes.arrayBuffer());
          if (scrapeBuffer.byteLength > 0 && scrapeBuffer.byteLength <= MAX_RESPONSE_SIZE) {
            logStep(logs, 'step4_worker', 'success', `PDF ${scrapeBuffer.byteLength} octets`, { durationMs: dur });
            const r4 = await tryAnalyze(scrapeBuffer, 'step4_analyze', 'worker_headless', targetUrl);
            if (r4) return r4;
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
  } else {
    logStep(logs, 'step4_worker', 'skip', 'Worker skipped (batch mode)');
  }

  // --- All methods exhausted ---
  if (resolvedFromBoamp) {
    logStep(logs, 'step5_boamp_fallback', 'skip', `Chaine echouee sur profil acheteur, URL BOAMP originale: ${normalizeUrl(dceUrl)}`);
  }

  logStep(logs, 'exhausted', 'fail', 'Toutes les methodes echouees');

  const errorMsg = pdfFoundButAnalysisFailed
    ? 'PDF trouve mais l\'analyse IA a echoue. Verifiez les cles API ou uploadez manuellement.'
    : 'Impossible de recuperer le PDF automatiquement';

  return { success: false, error: errorMsg, logs, fallbackUrl, resolvedUrl: targetUrl };
}
