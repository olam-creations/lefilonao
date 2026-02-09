import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const cpv = req.nextUrl.searchParams.get('cpv') ?? '72';

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('decp_attributions')
      .select('winner_name, amount, cpv_code')
      .eq('cpv_sector', cpv)
      .not('winner_name', 'eq', '');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const map = new Map<string, {
      wins: number;
      totalVolume: number;
      cpvCodes: Set<string>;
    }>();

    const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());

    for (const row of data ?? []) {
      const name = row.winner_name as string;
      if (isSiret(name)) continue;
      const entry = map.get(name) ?? { wins: 0, totalVolume: 0, cpvCodes: new Set<string>() };
      entry.wins += 1;
      entry.totalVolume += Number(row.amount) || 0;
      if (row.cpv_code) entry.cpvCodes.add(String(row.cpv_code).substring(0, 2));
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
      }));

    return NextResponse.json({ competitors });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
