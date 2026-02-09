import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { CPV_NAMES } from '@/components/market/utils';

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  const cpv = req.nextUrl.searchParams.get('cpv');

  if (!name) {
    return NextResponse.json({ error: 'name parameter required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('decp_attributions')
      .select('id, title, buyer_name, amount, notification_date, cpv_code, region')
      .eq('winner_name', name);

    if (cpv) query = query.eq('cpv_sector', cpv);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = data ?? [];
    const totalVolume = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    // Top buyers
    const buyerMap = new Map<string, number>();
    for (const r of rows) {
      const b = r.buyer_name as string;
      if (b && !/^\d{9,14}$/.test(b.trim())) {
        buyerMap.set(b, (buyerMap.get(b) ?? 0) + 1);
      }
    }
    const topBuyers = [...buyerMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([n, count]) => ({ name: n, count }));

    // Sectors
    const sectorMap = new Map<string, number>();
    for (const r of rows) {
      if (r.cpv_code) {
        const code = String(r.cpv_code).substring(0, 2);
        sectorMap.set(code, (sectorMap.get(code) ?? 0) + 1);
      }
    }
    const sectors = [...sectorMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([code, count]) => ({ code, name: CPV_NAMES[code] ?? code, count }));

    // Regions
    const regionMap = new Map<string, number>();
    for (const r of rows) {
      if (r.region) {
        regionMap.set(r.region as string, (regionMap.get(r.region as string) ?? 0) + 1);
      }
    }
    const regions = [...regionMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([rName, count]) => ({ name: rName, count }));

    // Trend (12 months)
    const trendMap = new Map<string, { count: number; volume: number }>();
    for (const r of rows) {
      if (!r.notification_date) continue;
      const month = String(r.notification_date).substring(0, 7);
      const entry = trendMap.get(month) ?? { count: 0, volume: 0 };
      entry.count += 1;
      entry.volume += Number(r.amount) || 0;
      trendMap.set(month, entry);
    }
    const trend = [...trendMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, v]) => ({ month, count: v.count, volume: Math.round(v.volume) }));

    // Recent wins
    const recentWins = [...rows]
      .filter((r) => r.notification_date)
      .sort((a, b) => String(b.notification_date).localeCompare(String(a.notification_date)))
      .slice(0, 5)
      .map((r) => ({
        id: r.id as string,
        title: r.title as string,
        buyerName: r.buyer_name as string,
        amount: Number(r.amount) || 0,
        date: r.notification_date as string,
      }));

    return NextResponse.json({
      winner: {
        name,
        totalWins: rows.length,
        totalVolume: Math.round(totalVolume),
        avgBudget: rows.length > 0 ? Math.round(totalVolume / rows.length) : 0,
        topBuyers,
        sectors,
        regions,
        recentWins,
        trend,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
