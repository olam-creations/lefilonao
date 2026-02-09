import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { CPV_NAMES } from '@/components/market/utils';

function normalizeLieu(raw: string): string {
  const s = (raw ?? '').trim().toUpperCase();
  if (!s || s.length < 2) return '';
  return s
    .replace(/\bCEDEX\b.*$/i, '')
    .replace(/\d{5}/g, '')
    .replace(/^VILLE\s+D[EU']\s*/i, '')
    .replace(/^COMMUNE\s+D[EU']\s*/i, '')
    .replace(/^MAIRIE\s+D[EU']\s*/i, '')
    .trim();
}

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get('region');
  const cpv = req.nextUrl.searchParams.get('cpv');

  if (!region) {
    return NextResponse.json({ error: 'region parameter required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('decp_attributions')
      .select('id, title, buyer_name, winner_name, amount, notification_date, cpv_code, lieu_execution')
      .eq('region', region);

    if (cpv) query = query.eq('cpv_sector', cpv);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = data ?? [];
    const totalVolume = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());

    // Location breakdown from lieu_execution
    const lieuMap = new Map<string, { count: number; volume: number }>();
    for (const r of rows) {
      const lieu = normalizeLieu(r.lieu_execution as string);
      if (lieu) {
        const entry = lieuMap.get(lieu) ?? { count: 0, volume: 0 };
        entry.count += 1;
        entry.volume += Number(r.amount) || 0;
        lieuMap.set(lieu, entry);
      }
    }
    const locations = [...lieuMap.entries()]
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, 15)
      .map(([name, val]) => ({
        name,
        count: val.count,
        volume: Math.round(val.volume),
      }));

    // Top buyers
    const buyerMap = new Map<string, number>();
    for (const r of rows) {
      const name = r.buyer_name as string;
      if (name && !isSiret(name)) {
        buyerMap.set(name, (buyerMap.get(name) ?? 0) + 1);
      }
    }
    const topBuyers = [...buyerMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Top winners
    const winnerMap = new Map<string, number>();
    for (const r of rows) {
      const name = r.winner_name as string;
      if (name && !isSiret(name)) {
        winnerMap.set(name, (winnerMap.get(name) ?? 0) + 1);
      }
    }
    const topWinners = [...winnerMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

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

    // Recent contracts
    const recentContracts = [...rows]
      .filter((r) => r.notification_date)
      .sort((a, b) => String(b.notification_date).localeCompare(String(a.notification_date)))
      .slice(0, 5)
      .map((r) => ({
        id: r.id as string,
        title: r.title as string,
        buyerName: r.buyer_name as string,
        winnerName: r.winner_name as string,
        amount: Number(r.amount) || 0,
        date: r.notification_date as string,
        lieuExecution: (r.lieu_execution as string) || '',
      }));

    return NextResponse.json({
      region: {
        name: region,
        totalContracts: rows.length,
        totalVolume: Math.round(totalVolume),
        avgAmount: rows.length > 0 ? Math.round(totalVolume / rows.length) : 0,
        locations,
        topBuyers,
        topWinners,
        sectors,
        recentContracts,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
