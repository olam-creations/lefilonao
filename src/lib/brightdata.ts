const API_URL = 'https://api.brightdata.com/request';
const FETCH_TIMEOUT = 45_000;
const MAX_SIZE = 25 * 1024 * 1024;

// ─── Types ───

export interface SerpResult {
  title: string;
  url: string;
  snippet: string;
}

export interface DceDocument {
  name: string;
  url: string;
}

interface BrightDataResult {
  buffer: Buffer;
  contentType: string;
}

interface BrightDataRequestConfig {
  url: string;
  dataFormat?: string;
  country?: string;
}

// ─── TTL Cache ───

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setCache<T>(key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
  // Evict expired entries periodically (keep map bounded)
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}

// ─── Core Request ───

async function brightDataRequest(config: BrightDataRequestConfig): Promise<BrightDataResult | null> {
  const apiKey = process.env.BRIGHTDATA_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const body: Record<string, unknown> = {
      zone: 'le_filon',
      url: config.url,
      format: 'raw',
      country: config.country ?? 'fr',
    };
    if (config.dataFormat) {
      body.data_format = config.dataFormat;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? '';
    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > MAX_SIZE) return null;

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ───

/**
 * Fetch a PDF via Bright Data Web Unlocker, following HTML pages to find PDF links.
 * Returns the PDF buffer or null.
 */
export async function fetchPdfViaBrightData(url: string): Promise<Buffer | null> {
  const result = await brightDataRequest({ url });
  if (!result) return null;

  // Direct PDF
  if (result.contentType.includes('application/pdf')) {
    return result.buffer;
  }

  // Check if response body starts with PDF magic bytes (%PDF)
  if (result.buffer.byteLength > 4 && result.buffer[0] === 0x25 && result.buffer[1] === 0x50 && result.buffer[2] === 0x44 && result.buffer[3] === 0x46) {
    return result.buffer;
  }

  // HTML — extract PDF links and follow the first one
  if (result.contentType.includes('text/html') || result.contentType.includes('text/plain')) {
    const html = result.buffer.toString('utf-8');
    const pdfLinks: string[] = [];
    const regex = /href=["'](https?:\/\/[^"']*\.pdf(?:\?[^"']*)?)["']/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      pdfLinks.push(match[1]);
    }

    // Also look for download links (common on procurement platforms)
    const downloadRegex = /href=["'](https?:\/\/[^"']*(?:download|telecharger|document|dce|piece|fichier)[^"']*)["']/gi;
    while ((match = downloadRegex.exec(html)) !== null) {
      if (!pdfLinks.includes(match[1])) {
        pdfLinks.push(match[1]);
      }
    }

    for (const pdfUrl of pdfLinks.slice(0, 3)) {
      const pdfResult = await brightDataRequest({ url: pdfUrl });
      if (!pdfResult) continue;

      if (pdfResult.contentType.includes('application/pdf')) {
        return pdfResult.buffer;
      }
      // Check PDF magic bytes
      if (pdfResult.buffer.byteLength > 4 && pdfResult.buffer[0] === 0x25 && pdfResult.buffer[1] === 0x50) {
        return pdfResult.buffer;
      }
    }
  }

  return null;
}

/**
 * Convert raw HTML to simplified text suitable for LLM consumption.
 * Strips tags, decodes entities, normalizes whitespace.
 */
function htmlToText(html: string): string {
  let text = html;
  // Remove script/style blocks
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  // Convert structural elements to newlines
  text = text.replace(/<\/?(h[1-6]|p|div|br|li|tr|section|article|header|footer|nav|table|thead|tbody)[^>]*>/gi, '\n');
  // Convert links to [text](url)
  text = text.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ');
  text = text.replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)));
  // Normalize whitespace: collapse multiple spaces, trim lines, collapse blank lines
  text = text.replace(/[ \t]+/g, ' ');
  text = text.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/**
 * Scrape any page as text (JS rendering via BD raw, then HTML-to-text).
 * Cached 24h in-memory.
 */
export async function fetchMarkdown(url: string): Promise<string | null> {
  const cacheKey = `md:${url}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const result = await brightDataRequest({ url });
  if (!result) return null;

  const rawContent = result.buffer.toString('utf-8').trim();
  if (!rawContent) return null;

  // Convert HTML to LLM-friendly text
  const text = result.contentType.includes('text/html')
    ? htmlToText(rawContent)
    : rawContent;

  if (!text || text.length < 50) return null;

  setCache(cacheKey, text);
  return text;
}

/**
 * Structured Google SERP search via Bright Data.
 * Returns parsed search results. Cached 24h in-memory.
 */
export async function searchSerp(query: string, limit = 10): Promise<SerpResult[] | null> {
  const cacheKey = `serp:${query}:${limit}`;
  const cached = getCached<SerpResult[]>(cacheKey);
  if (cached) return cached;

  const googleUrl = `https://www.google.fr/search?q=${encodeURIComponent(query)}&num=${limit}&gl=fr&hl=fr`;

  const result = await brightDataRequest({
    url: googleUrl,
    dataFormat: 'parsed_light',
  });

  if (!result) return null;

  try {
    const text = result.buffer.toString('utf-8');
    const parsed = JSON.parse(text);
    const organic = parsed.organic ?? parsed.results ?? [];

    const results: SerpResult[] = organic.slice(0, limit).map((item: Record<string, unknown>) => ({
      title: String(item.title ?? ''),
      url: String(item.link ?? item.url ?? ''),
      snippet: String(item.description ?? item.snippet ?? ''),
    }));

    if (results.length > 0) {
      setCache(cacheKey, results);
    }

    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

/**
 * Scrape a page as markdown, then use AI to extract DCE document links.
 * Returns discovered documents or null.
 */
export async function discoverDceDocuments(url: string): Promise<DceDocument[] | null> {
  const { nvidiaGenerate, hasNvidiaKey } = await import('@/lib/ai-client');
  if (!hasNvidiaKey()) return null;

  const markdown = await fetchMarkdown(url);
  if (!markdown) return null;

  // Truncate markdown to avoid token overflow (keep first 6000 chars)
  const truncated = markdown.length > 6000 ? markdown.substring(0, 6000) : markdown;

  const prompt = `Extrais les URLs de telechargement des documents DCE de cette page de marche public.
Cherche: RC (reglement de consultation), CCTP, CCAP, BPU, DPGF, annexes, plans, avis, DCE.
Retourne UNIQUEMENT un JSON valide: [{"name":"RC","url":"https://..."}]
Si aucun lien de document trouve, retourne: []

Page en markdown:
${truncated}`;

  try {
    const raw = await nvidiaGenerate(prompt);
    const jsonStr = raw.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const docs: DceDocument[] = JSON.parse(jsonStr);

    return docs.filter((d) => d.url && d.url.startsWith('http')).slice(0, 10);
  } catch {
    return null;
  }
}
