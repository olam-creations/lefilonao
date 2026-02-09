import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const cpv = req.nextUrl.searchParams.get('cpv') ?? '72';

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('decp_attributions')
      .select('winner_name, winner_name_2, winner_name_3, groupement_type')
      .eq('cpv_sector', cpv)
      .not('winner_name', 'eq', '');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());
    const rows = data ?? [];
    let totalContracts = 0;
    let groupementCount = 0;

    const pairMap = new Map<string, number>();
    const typeMap = new Map<string, number>();

    for (const row of rows) {
      const w1 = row.winner_name as string;
      if (isSiret(w1)) continue;
      totalContracts += 1;

      const w2 = (row.winner_name_2 as string | null) ?? '';
      const w3 = (row.winner_name_3 as string | null) ?? '';
      const gType = (row.groupement_type as string | null) ?? '';

      const hasPartner = (w2 && !isSiret(w2)) || (w3 && !isSiret(w3));

      if (hasPartner || gType) {
        groupementCount += 1;
      }

      if (gType) {
        typeMap.set(gType, (typeMap.get(gType) ?? 0) + 1);
      }

      // Build pairs (sorted alphabetically for dedup)
      const partners = [w2, w3].filter((p) => p && !isSiret(p));
      for (const partner of partners) {
        const [a, b] = [w1, partner].sort();
        const key = `${a}|||${b}`;
        pairMap.set(key, (pairMap.get(key) ?? 0) + 1);
      }
    }

    const soloRate = totalContracts > 0
      ? Math.round(((totalContracts - groupementCount) / totalContracts) * 1000) / 10
      : 100;

    const pairs = [...pairMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const [partner1, partner2] = key.split('|||');
        return { partner1, partner2, count };
      });

    const types = [...typeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    return NextResponse.json({
      partnerships: {
        totalGroupements: groupementCount,
        soloRate,
        pairs,
        types,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
