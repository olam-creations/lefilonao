import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const cpv = req.nextUrl.searchParams.get('cpv') ?? '72';

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('decp_attributions')
      .select('region, amount')
      .eq('cpv_sector', cpv)
      .not('region', 'eq', '');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const map = new Map<string, { count: number; volume: number }>();
    for (const r of data ?? []) {
      const region = r.region as string;
      const entry = map.get(region) ?? { count: 0, volume: 0 };
      entry.count += 1;
      entry.volume += Number(r.amount) || 0;
      map.set(region, entry);
    }

    const regions = [...map.entries()]
      .sort((a, b) => b[1].volume - a[1].volume)
      .map(([name, val]) => ({
        name,
        count: val.count,
        volume: Math.round(val.volume),
        avgAmount: val.count > 0 ? Math.round(val.volume / val.count) : 0,
      }));

    return NextResponse.json({ regions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
