import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { requireFeature } from '@/lib/require-plan';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

const SIRET_RE = /^\d{9,14}$/;

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
  const period = Number(params.get('period')) || 12;

  try {
    const supabase = getSupabase();
    const since = new Date();
    since.setMonth(since.getMonth() - period);

    let query = supabase
      .from('decp_attributions')
      .select('winner_name, winner_siret, amount')
      .eq('cpv_sector', cpv)
      .gte('notification_date', since.toISOString().split('T')[0])
      .not('winner_name', 'eq', '')
      .limit(5000);

    if (region) {
      query = query.eq('region', region);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate wins and volume per company
    const companyMap = new Map<string, { wins: number; volume: number; siret: string }>();
    for (const row of data ?? []) {
      if (SIRET_RE.test(row.winner_name ?? '')) continue;
      const key = row.winner_name ?? '';
      const existing = companyMap.get(key) ?? { wins: 0, volume: 0, siret: '' };
      companyMap.set(key, {
        wins: existing.wins + 1,
        volume: existing.volume + (row.amount ?? 0),
        siret: row.winner_siret || existing.siret,
      });
    }

    const totalWins = Array.from(companyMap.values()).reduce((sum, c) => sum + c.wins, 0);
    const totalVolume = Array.from(companyMap.values()).reduce((sum, c) => sum + c.volume, 0);

    // Top companies by wins
    const shares = Array.from(companyMap.entries())
      .sort((a, b) => b[1].wins - a[1].wins)
      .slice(0, 15)
      .map(([name, stats]) => ({
        name,
        siret: stats.siret,
        wins: stats.wins,
        volume: stats.volume,
        shareByWins: totalWins > 0 ? Math.round((stats.wins / totalWins) * 100) : 0,
        shareByVolume: totalVolume > 0 ? Math.round((stats.volume / totalVolume) * 100) : 0,
      }));

    // "Others" bucket
    const topWins = shares.reduce((sum, s) => sum + s.wins, 0);
    const topVolume = shares.reduce((sum, s) => sum + s.volume, 0);

    const res = NextResponse.json({
      marketShare: {
        cpv,
        region: region || 'all',
        periodMonths: period,
        totalCompanies: companyMap.size,
        totalWins,
        totalVolume,
        shares,
        othersWins: totalWins - topWins,
        othersVolume: totalVolume - topVolume,
      },
    });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
