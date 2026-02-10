import { searchSerp, fetchMarkdown, type SerpResult } from '@/lib/brightdata';
import { nvidiaGenerate, hasNvidiaKey } from '@/lib/ai-client';

export interface WebProfile {
  website?: string;
  summary?: string;
  recentNews: SerpResult[];
}

export interface BuyerWebIntel {
  buyerSummary?: string;
  buyerContacts?: string[];
  serpNews: SerpResult[];
}

/**
 * Enrich a competitor with web data (SERP + website scrape).
 * Returns null if BRIGHTDATA_API_KEY is not configured.
 */
export async function enrichCompetitorFromWeb(query: string): Promise<WebProfile | null> {
  if (!query) return null;

  const serpResults = await searchSerp(`"${query}" entreprise`, 5);
  if (!serpResults || serpResults.length === 0) return null;

  const profile: WebProfile = {
    recentNews: serpResults.slice(0, 3),
  };

  // Find the most likely company website (skip aggregators)
  const skipDomains = ['societe.com', 'pappers.fr', 'infogreffe.fr', 'verif.com', 'linkedin.com'];
  const companyResult = serpResults.find((r) => {
    try {
      const host = new URL(r.url).hostname;
      return !skipDomains.some((d) => host.includes(d));
    } catch {
      return false;
    }
  });

  if (companyResult) {
    profile.website = companyResult.url;

    if (hasNvidiaKey()) {
      const markdown = await fetchMarkdown(companyResult.url);
      if (markdown) {
        const truncated = markdown.length > 4000 ? markdown.substring(0, 4000) : markdown;
        try {
          const raw = await nvidiaGenerate(
            `Resume ce site d'entreprise en 2-3 phrases concises (en francais).
Retourne UNIQUEMENT un JSON: {"summary":"..."}

Site:
${truncated}`,
          );
          const jsonStr = raw.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
          const parsed = JSON.parse(jsonStr);
          profile.summary = parsed.summary ?? undefined;
        } catch {
          // LLM extraction failed — profile remains without summary
        }
      }
    }
  }

  return profile;
}

/**
 * Enrich a buyer (acheteur public) with web intelligence.
 * Returns SERP news + optional website summary + contacts.
 */
export async function enrichBuyerFromWeb(buyerName: string): Promise<BuyerWebIntel | null> {
  if (!buyerName) return null;

  const serpResults = await searchSerp(`"${buyerName}" marches publics`, 5);
  if (!serpResults || serpResults.length === 0) return null;

  const intel: BuyerWebIntel = {
    serpNews: serpResults.slice(0, 5),
  };

  // Find buyer website from SERP
  const skipDomains = ['boamp.fr', 'marches-publics.gouv.fr', 'ted.europa.eu', 'achatpublic.com'];
  const buyerSite = serpResults.find((r) => {
    try {
      const host = new URL(r.url).hostname;
      return !skipDomains.some((d) => host.includes(d));
    } catch {
      return false;
    }
  });

  if (buyerSite && hasNvidiaKey()) {
    const markdown = await fetchMarkdown(buyerSite.url);
    if (markdown) {
      const truncated = markdown.length > 4000 ? markdown.substring(0, 4000) : markdown;
      try {
        const raw = await nvidiaGenerate(
          `Resume ce site d'acheteur public en 3 phrases. Extrais les contacts (emails, telephones) si presents.
Retourne UNIQUEMENT un JSON: {"summary":"...","contacts":["email@...", "01 23 ..."]}

Site:
${truncated}`,
        );
        const jsonStr = raw.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
        const parsed = JSON.parse(jsonStr);
        intel.buyerSummary = parsed.summary ?? undefined;
        if (Array.isArray(parsed.contacts) && parsed.contacts.length > 0) {
          intel.buyerContacts = parsed.contacts;
        }
      } catch {
        // LLM extraction failed — intel remains without summary
      }
    }
  }

  return intel;
}
