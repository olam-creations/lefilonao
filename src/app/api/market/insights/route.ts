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
  const supabase = getSupabase();

  const isSiret = (s: string) => /^\d{9,14}$/.test(s.trim());

  try {
    const [buyersRes, winnersRes] = await Promise.all([
      supabase
        .from('decp_attributions')
        .select('buyer_name')
        .eq('cpv_sector', cpv)
        .not('buyer_name', 'eq', '')
        .limit(5000),
      supabase
        .from('decp_attributions')
        .select('winner_name')
        .eq('cpv_sector', cpv)
        .not('winner_name', 'eq', '')
        .limit(5000),
    ]);

    const { count: totalContracts } = await supabase
      .from('decp_attributions')
      .select('*', { count: 'exact', head: true })
      .eq('cpv_sector', cpv);

    const { data: amountData } = await supabase
      .from('decp_attributions')
      .select('amount')
      .eq('cpv_sector', cpv)
      .limit(5000);

    const amounts = (amountData ?? []).map((r) => Number(r.amount) || 0);
    const totalValue = amounts.reduce((s, a) => s + a, 0);
    const avgValue = amounts.length > 0 ? totalValue / amounts.length : 0;

    // Top buyers (skip unresolved SIRETs)
    const buyerCounts = new Map<string, number>();
    for (const r of buyersRes.data ?? []) {
      const name = r.buyer_name as string;
      if (!isSiret(name)) {
        buyerCounts.set(name, (buyerCounts.get(name) ?? 0) + 1);
      }
    }
    const topBuyers = [...buyerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // Top winners (skip unresolved SIRETs)
    const winnerCounts = new Map<string, number>();
    for (const r of winnersRes.data ?? []) {
      const name = r.winner_name as string;
      if (!isSiret(name)) {
        winnerCounts.set(name, (winnerCounts.get(name) ?? 0) + 1);
      }
    }
    const topWinners = [...winnerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const sectorName = {
      '72': 'Services IT', '48': 'Logiciels', '79': 'Services entreprises',
      '71': 'Architecture & Ingénierie', '80': 'Formation', '64': 'Télécoms',
    }[cpv] ?? cpv;

    const res = NextResponse.json({
      market: {
        sector: sectorName,
        totalContracts: totalContracts ?? 0,
        totalValue: Math.round(totalValue),
        avgValue: Math.round(avgValue),
        topBuyers,
        topWinners,
      },
    });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
