import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { requireFeature } from '@/lib/require-plan';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const gated = await requireFeature(auth.auth.email, 'buyer-intelligence');
  if (gated) return gated;

  const params = req.nextUrl.searchParams;
  const cpv = params.get('cpv') ?? '72';
  const region = params.get('region') ?? '';

  try {
    const supabase = getSupabase();
    const since = new Date();
    since.setFullYear(since.getFullYear() - 2);

    // Fetch awards in this sector
    let query = supabase
      .from('decp_attributions')
      .select('winner_name, winner_siret, amount, notification_date, offers_received')
      .eq('cpv_sector', cpv)
      .gte('notification_date', since.toISOString().split('T')[0])
      .gt('amount', 0)
      .limit(5000);

    if (region) {
      query = query.eq('region', region);
    }

    const { data: awards, error } = await query;
    if (error) throw error;

    if (!awards || awards.length < 5) {
      return NextResponse.json({ patterns: null, reason: 'Donnees insuffisantes (min. 5 contrats)' });
    }

    // Fetch company enrichment for winners
    const winnerSirets = [...new Set(awards.map((a) => a.winner_siret).filter(Boolean))];
    let companiesMap = new Map<string, { est_rge: boolean; effectif_tranche: string; region: string; date_creation: string; chiffre_affaires: number }>();

    if (winnerSirets.length > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('siret, est_rge, effectif_tranche, region, date_creation, chiffre_affaires')
        .in('siret', winnerSirets.slice(0, 200));

      for (const c of companies ?? []) {
        companiesMap.set(c.siret, {
          est_rge: c.est_rge ?? false,
          effectif_tranche: c.effectif_tranche ?? '',
          region: c.region ?? '',
          date_creation: c.date_creation ?? '',
          chiffre_affaires: c.chiffre_affaires ?? 0,
        });
      }
    }

    // Compute patterns from enriched data
    const enriched = awards.filter((a) => a.winner_siret && companiesMap.has(a.winner_siret));
    const total = enriched.length;

    if (total < 3) {
      return NextResponse.json({ patterns: null, reason: 'Donnees entreprises insuffisantes' });
    }

    const currentYear = new Date().getFullYear();
    let rgeCount = 0;
    let localCount = 0;
    let largeTeamCount = 0;
    let highRevenueCount = 0;
    let experiencedCount = 0;

    for (const a of enriched) {
      const c = companiesMap.get(a.winner_siret!)!;
      if (c.est_rge) rgeCount++;
      if (region && c.region === region) localCount++;
      const effectif = parseInt(c.effectif_tranche) || 0;
      if (effectif >= 5 || c.effectif_tranche.includes('10')) largeTeamCount++;
      if (c.chiffre_affaires >= 500000) highRevenueCount++;
      if (c.date_creation) {
        const year = parseInt(c.date_creation.substring(0, 4));
        if (year > 1900 && currentYear - year >= 5) experiencedCount++;
      }
    }

    // Amount stats
    const amounts = awards.map((a) => a.amount as number).sort((a, b) => a - b);
    const medianAmount = amounts[Math.floor(amounts.length / 2)];

    // Competition level
    const avgOffers = awards.filter((a) => a.offers_received).length > 0
      ? Math.round(awards.reduce((sum, a) => sum + (a.offers_received ?? 0), 0) / awards.filter((a) => a.offers_received).length)
      : null;

    const patterns = {
      cpv,
      region: region || 'all',
      sampleSize: total,
      totalAwards: awards.length,
      medianAmount,
      avgOffersPerContract: avgOffers,
      traits: [
        { key: 'certification', label: 'Certification RGE/ISO', pct: Math.round((rgeCount / total) * 100), threshold: 50 },
        ...(region ? [{ key: 'local', label: 'Implantation locale', pct: Math.round((localCount / total) * 100), threshold: 50 }] : []),
        { key: 'team', label: 'Equipe 5+ personnes', pct: Math.round((largeTeamCount / total) * 100), threshold: 50 },
        { key: 'revenue', label: 'CA > 500K EUR', pct: Math.round((highRevenueCount / total) * 100), threshold: 50 },
        { key: 'experience', label: 'Anciennete 5+ ans', pct: Math.round((experiencedCount / total) * 100), threshold: 50 },
      ],
    };

    const res = NextResponse.json({ patterns });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
