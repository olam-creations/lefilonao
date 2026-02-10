import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const cpv = req.nextUrl.searchParams.get('cpv') ?? '72';

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('decp_attributions')
      .select('winner_name, amount, offers_received')
      .eq('cpv_sector', cpv)
      .not('winner_name', 'eq', '')
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());
    const rows = data ?? [];

    // Average offers (only non-null)
    const offerValues = rows
      .map((r) => Number(r.offers_received))
      .filter((v) => v > 0);
    const avgOffers = offerValues.length > 0
      ? Math.round((offerValues.reduce((s, v) => s + v, 0) / offerValues.length) * 10) / 10
      : 0;

    // Winner market shares
    const winnerMap = new Map<string, { wins: number; volume: number }>();
    let totalWins = 0;

    for (const row of rows) {
      const name = row.winner_name as string;
      if (isSiret(name)) continue;
      const entry = winnerMap.get(name) ?? { wins: 0, volume: 0 };
      entry.wins += 1;
      entry.volume += Number(row.amount) || 0;
      winnerMap.set(name, entry);
      totalWins += 1;
    }

    const topShareholders = [...winnerMap.entries()]
      .sort((a, b) => b[1].wins - a[1].wins)
      .slice(0, 10)
      .map(([name, val]) => ({
        name,
        share: totalWins > 0 ? Math.round((val.wins / totalWins) * 10000) / 100 : 0,
        wins: val.wins,
      }));

    // HHI = sum of squared market shares (0-10000)
    const allShares = [...winnerMap.values()].map((v) =>
      totalWins > 0 ? (v.wins / totalWins) * 100 : 0,
    );
    const hhi = Math.round(allShares.reduce((sum, s) => sum + s * s, 0));

    const concentration: 'low' | 'moderate' | 'high' =
      hhi < 1500 ? 'low' : hhi < 2500 ? 'moderate' : 'high';

    const res = NextResponse.json({
      competition: { avgOffers, hhi, concentration, topShareholders },
    });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
