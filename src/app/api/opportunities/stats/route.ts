import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    const [totalRes, urgentRes, sectorRes] = await Promise.all([
      supabase
        .from('boamp_notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_open', true),
      supabase
        .from('boamp_notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_open', true)
        .lte('deadline', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .gte('deadline', now),
      supabase
        .from('boamp_notices')
        .select('cpv_sector')
        .eq('is_open', true),
    ]);

    const sectorCounts = new Map<string, number>();
    for (const row of sectorRes.data ?? []) {
      const s = row.cpv_sector as string;
      if (s) sectorCounts.set(s, (sectorCounts.get(s) ?? 0) + 1);
    }

    const CPV_NAMES: Record<string, string> = {
      '72': 'IT', '48': 'Logiciels', '79': 'Services', '71': 'Ingénierie',
      '80': 'Formation', '64': 'Télécoms', '50': 'Maintenance', '45': 'BTP',
      '34': 'Transport', '33': 'Médical',
    };

    const bySector = [...sectorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, name: CPV_NAMES[code] ?? code, count }));

    return NextResponse.json({
      stats: {
        totalOpen: totalRes.count ?? 0,
        urgentCount: urgentRes.count ?? 0,
        bySector,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
