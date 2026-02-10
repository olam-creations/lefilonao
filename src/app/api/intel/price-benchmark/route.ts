import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { requireFeature } from '@/lib/require-plan';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const gated = await requireFeature(auth.auth.email, 'buyer-intelligence');
  if (gated) return gated;

  const params = req.nextUrl.searchParams;
  const cpv = params.get('cpv') ?? '';
  const region = params.get('region') ?? '';
  const amount = Number(params.get('amount')) || 0;

  if (!cpv) {
    return NextResponse.json({ error: 'Parametre cpv requis' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const since = new Date();
    since.setFullYear(since.getFullYear() - 2);

    // Similar contracts: same CPV sector, ±50% amount range
    let query = supabase
      .from('decp_attributions')
      .select('amount, notification_date, title, buyer_name')
      .eq('cpv_sector', cpv.substring(0, 2))
      .gte('notification_date', since.toISOString().split('T')[0])
      .gt('amount', 0)
      .order('notification_date', { ascending: false })
      .limit(500);

    if (region) {
      query = query.eq('region', region);
    }

    if (amount > 0) {
      query = query.gte('amount', Math.round(amount * 0.5)).lte('amount', Math.round(amount * 1.5));
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ benchmark: null });
    }

    const amounts = data.map((d) => d.amount as number).sort((a, b) => a - b);
    const min = amounts[0];
    const max = amounts[amounts.length - 1];
    const median = amounts[Math.floor(amounts.length / 2)];
    const avg = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);

    // Winning range: middle 60% (P20-P80)
    const p20 = amounts[Math.floor(amounts.length * 0.2)];
    const p80 = amounts[Math.floor(amounts.length * 0.8)];
    const winningRangePct = Math.round(((amounts.filter((a) => a >= p20 && a <= p80).length) / amounts.length) * 100);

    // Distribution buckets for histogram
    const bucketCount = 8;
    const range = max - min;
    const bucketSize = range > 0 ? range / bucketCount : 1;
    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const low = min + i * bucketSize;
      const high = low + bucketSize;
      return {
        low: Math.round(low),
        high: Math.round(high),
        count: amounts.filter((a) => a >= low && (i === bucketCount - 1 ? a <= high : a < high)).length,
      };
    });

    const res = NextResponse.json({
      benchmark: {
        cpv,
        region: region || 'all',
        referenceAmount: amount,
        sampleSize: amounts.length,
        min,
        max,
        median,
        avg,
        p20,
        p80,
        winningRangePct,
        buckets,
      },
    });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
