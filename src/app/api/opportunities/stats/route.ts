import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const [totalRes, urgentRes, sectorRes, newRes, avgRes] = await Promise.all([
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
      supabase
        .from('boamp_notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_open', true)
        .gte('publication_date', fortyEightHoursAgo),
      supabase
        .from('boamp_notices')
        .select('estimated_amount')
        .eq('is_open', true)
        .gt('estimated_amount', 0),
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

    const amounts = (avgRes.data ?? []).map((r) => Number(r.estimated_amount) || 0);
    const avgAmount = amounts.length > 0
      ? Math.round(amounts.reduce((sum, a) => sum + a, 0) / amounts.length)
      : 0;

    return NextResponse.json({
      stats: {
        totalOpen: totalRes.count ?? 0,
        urgentCount: urgentRes.count ?? 0,
        newLast48h: newRes.count ?? 0,
        avgAmount,
        bySector,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
