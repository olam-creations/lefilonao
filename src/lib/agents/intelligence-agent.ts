import { getSupabase } from '@/lib/supabase';
import { enrichBuyerFromWeb } from '@/lib/web-enrichment';
import type { ParsedDce, MarketIntelligence } from './types';

/**
 * Gathers market intelligence from DB + optional web enrichment.
 * Web is run in parallel and never blocks the pipeline.
 */
export async function runIntelligence(parsed: ParsedDce): Promise<MarketIntelligence> {
  const [dbResult, webResult] = await Promise.allSettled([
    fetchDbIntelligence(parsed),
    fetchWebIntelligence(parsed),
  ]);

  const db = dbResult.status === 'fulfilled' ? dbResult.value : { buyerHistory: { totalContracts: 0, avgAmount: 0, topWinners: [], recentContracts: [] }, competitors: [], sectorStats: { avgOffers: 0, avgAmount: 0, totalContracts: 0 }, hhi: 0 };
  const web = webResult.status === 'fulfilled' ? webResult.value : undefined;

  return { ...db, webIntel: web ?? undefined };
}

async function fetchDbIntelligence(parsed: ParsedDce): Promise<Omit<MarketIntelligence, 'webIntel'>> {
  const supabase = getSupabase();
  const buyerName = parsed.buyerName;
  const cpvSector = parsed.cpvCodes[0]?.substring(0, 2) ?? '';

  const buyerHistory = await fetchBuyerHistory(supabase, buyerName);
  const competitors = cpvSector ? await fetchCompetitors(supabase, cpvSector) : [];
  const sectorStats = cpvSector ? await fetchSectorStats(supabase, cpvSector) : { avgOffers: 0, avgAmount: 0, totalContracts: 0 };
  const hhi = computeHHI(competitors);

  return { buyerHistory, competitors, sectorStats, hhi };
}

async function fetchWebIntelligence(parsed: ParsedDce): Promise<MarketIntelligence['webIntel']> {
  if (!process.env.BRIGHTDATA_API_KEY) return undefined;

  const buyerIntel = await enrichBuyerFromWeb(parsed.buyerName);
  if (!buyerIntel) return undefined;

  return {
    buyerSummary: buyerIntel.buyerSummary,
    buyerContacts: buyerIntel.buyerContacts,
    serpNews: buyerIntel.serpNews,
  };
}

async function fetchBuyerHistory(supabase: ReturnType<typeof getSupabase>, buyerName: string) {
  if (!buyerName) {
    return { totalContracts: 0, avgAmount: 0, topWinners: [], recentContracts: [] };
  }

  const { data } = await supabase
    .from('decp_attributions')
    .select('title, winner_name, amount, notification_date')
    .eq('buyer_name', buyerName)
    .order('notification_date', { ascending: false })
    .limit(500);

  const rows = data ?? [];
  const totalVolume = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  // Top winners
  const winnerMap = new Map<string, number>();
  for (const r of rows) {
    const w = r.winner_name as string;
    if (w && !/^\d{9,14}$/.test(w.trim())) {
      winnerMap.set(w, (winnerMap.get(w) ?? 0) + 1);
    }
  }
  const topWinners = [...winnerMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const recentContracts = rows.slice(0, 5).map((r) => ({
    title: (r.title as string) ?? '',
    winner: (r.winner_name as string) ?? '',
    amount: Number(r.amount) || 0,
  }));

  return {
    totalContracts: rows.length,
    avgAmount: rows.length > 0 ? Math.round(totalVolume / rows.length) : 0,
    topWinners,
    recentContracts,
  };
}

async function fetchCompetitors(supabase: ReturnType<typeof getSupabase>, cpvSector: string) {
  const { data } = await supabase
    .from('decp_attributions')
    .select('winner_name, amount')
    .eq('cpv_sector', cpvSector)
    .not('winner_name', 'eq', '')
    .limit(5000);

  const rows = data ?? [];
  const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());

  const winnerMap = new Map<string, { wins: number; volume: number }>();
  let totalWins = 0;

  for (const row of rows) {
    const name = row.winner_name as string;
    if (isSiret(name)) continue;
    const entry = winnerMap.get(name) ?? { wins: 0, volume: 0 };
    winnerMap.set(name, { wins: entry.wins + 1, volume: entry.volume + (Number(row.amount) || 0) });
    totalWins++;
  }

  return [...winnerMap.entries()]
    .sort((a, b) => b[1].wins - a[1].wins)
    .slice(0, 10)
    .map(([name, stats]) => ({
      name,
      wins: stats.wins,
      marketShare: totalWins > 0 ? Math.round((stats.wins / totalWins) * 10000) / 100 : 0,
    }));
}

async function fetchSectorStats(supabase: ReturnType<typeof getSupabase>, cpvSector: string) {
  const { data } = await supabase
    .from('decp_attributions')
    .select('amount, offers_received')
    .eq('cpv_sector', cpvSector)
    .limit(5000);

  const rows = data ?? [];
  const amounts = rows.map((r) => Number(r.amount) || 0).filter((v) => v > 0);
  const offers = rows.map((r) => Number(r.offers_received) || 0).filter((v) => v > 0);

  return {
    totalContracts: rows.length,
    avgAmount: amounts.length > 0 ? Math.round(amounts.reduce((s, v) => s + v, 0) / amounts.length) : 0,
    avgOffers: offers.length > 0 ? Math.round((offers.reduce((s, v) => s + v, 0) / offers.length) * 10) / 10 : 0,
  };
}

/**
 * Herfindahl-Hirschman Index: sum of squared market shares.
 * 0-1500: low concentration, 1500-2500: moderate, 2500+: high.
 */
function computeHHI(competitors: { marketShare: number }[]): number {
  return Math.round(competitors.reduce((sum, c) => sum + c.marketShare * c.marketShare, 0));
}
