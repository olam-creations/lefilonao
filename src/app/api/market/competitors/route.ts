import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const cpv = req.nextUrl.searchParams.get('cpv') ?? '72';

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('decp_attributions')
      .select('winner_name, amount, cpv_code, offers_received')
      .eq('cpv_sector', cpv)
      .not('winner_name', 'eq', '')
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const map = new Map<string, {
      wins: number;
      totalVolume: number;
      cpvCodes: Set<string>;
      totalOffers: number;
      offersCount: number;
    }>();

    const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());

    for (const row of data ?? []) {
      const name = row.winner_name as string;
      if (isSiret(name)) continue;
      const entry = map.get(name) ?? { wins: 0, totalVolume: 0, cpvCodes: new Set<string>(), totalOffers: 0, offersCount: 0 };
      entry.wins += 1;
      entry.totalVolume += Number(row.amount) || 0;
      if (row.cpv_code) entry.cpvCodes.add(String(row.cpv_code).substring(0, 2));
      const offers = Number(row.offers_received);
      if (offers > 0) {
        entry.totalOffers += offers;
        entry.offersCount += 1;
      }
      map.set(name, entry);
    }

    const CPV_NAMES: Record<string, string> = {
      '72': 'IT', '48': 'Logiciels', '79': 'Services', '71': 'Ingénierie',
      '80': 'Formation', '64': 'Télécoms', '50': 'Maintenance', '45': 'BTP',
      '34': 'Transport', '33': 'Médical',
    };

    const competitors = [...map.entries()]
      .sort((a, b) => b[1].wins - a[1].wins)
      .slice(0, 20)
      .map(([name, val]) => ({
        name,
        wins: val.wins,
        totalVolume: Math.round(val.totalVolume),
        avgBudget: val.wins > 0 ? Math.round(val.totalVolume / val.wins) : 0,
        sectors: [...val.cpvCodes].slice(0, 3).map((c) => CPV_NAMES[c] ?? c),
        winRate: val.offersCount > 0
          ? Math.round((val.offersCount / val.totalOffers) * 1000) / 10
          : undefined,
      }));

    const res = NextResponse.json({ competitors });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
