import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const cpv = req.nextUrl.searchParams.get('cpv') ?? '72';
  const buyerName = req.nextUrl.searchParams.get('buyer') ?? '';

  try {
    const supabase = getSupabase();

    let query = supabase
      .from('decp_attributions')
      .select('buyer_name, winner_name, amount')
      .eq('cpv_sector', cpv);

    if (buyerName) {
      query = query.eq('buyer_name', buyerName);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());

    // buyer → winner → { count, totalAmount }
    const pairMap = new Map<string, Map<string, { count: number; totalAmount: number }>>();
    const buyerTotals = new Map<string, number>();

    for (const row of data ?? []) {
      const buyer = row.buyer_name as string;
      const winner = row.winner_name as string;
      if (!buyer || !winner || isSiret(buyer) || isSiret(winner)) continue;

      const winnerMap = pairMap.get(buyer) ?? new Map();
      const entry = winnerMap.get(winner) ?? { count: 0, totalAmount: 0 };
      entry.count += 1;
      entry.totalAmount += Number(row.amount) || 0;
      winnerMap.set(winner, entry);
      pairMap.set(buyer, winnerMap);

      buyerTotals.set(buyer, (buyerTotals.get(buyer) ?? 0) + 1);
    }

    // Build recurrence pairs (at least 2 contracts)
    const pairs: Array<{
      buyerName: string;
      winnerName: string;
      contracts: number;
      totalVolume: number;
      loyaltyPct: number;
      isLocked: boolean;
    }> = [];

    for (const [buyer, winnerMap] of pairMap) {
      const buyerTotal = buyerTotals.get(buyer) ?? 0;
      for (const [winner, stats] of winnerMap) {
        if (stats.count < 2) continue;
        const loyaltyPct = buyerTotal > 0
          ? Math.round((stats.count / buyerTotal) * 100)
          : 0;
        pairs.push({
          buyerName: buyer,
          winnerName: winner,
          contracts: stats.count,
          totalVolume: Math.round(stats.totalAmount),
          loyaltyPct,
          isLocked: loyaltyPct >= 60,
        });
      }
    }

    pairs.sort((a, b) => b.contracts - a.contracts);

    return NextResponse.json({ recurrence: pairs.slice(0, 50) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
