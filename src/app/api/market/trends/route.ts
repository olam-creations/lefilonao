import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const cpv = req.nextUrl.searchParams.get('cpv') ?? '72';

  try {
    const supabase = getSupabase();

    // Get the most recent 12 months of data that actually exist
    const { data, error } = await supabase
      .from('decp_attributions')
      .select('notification_date, amount')
      .eq('cpv_sector', cpv)
      .not('notification_date', 'is', null)
      .order('notification_date', { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const buckets = new Map<string, { count: number; volume: number }>();

    for (const row of data ?? []) {
      if (!row.notification_date) continue;
      const d = new Date(row.notification_date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const bucket = buckets.get(key) ?? { count: 0, volume: 0 };
      bucket.count += 1;
      bucket.volume += Number(row.amount) || 0;
      buckets.set(key, bucket);
    }

    // Take the most recent 12 months
    const volumeTrend = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, val]) => {
        const monthIdx = Number(key.split('-')[1]);
        return {
          month: MONTH_LABELS[monthIdx] ?? key,
          count: val.count,
          volume: Math.round(val.volume),
        };
      });

    const res = NextResponse.json({ volumeTrend });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
