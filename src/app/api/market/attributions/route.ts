import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const cpv = params.get('cpv') ?? '72';
  const limit = Math.min(Number(params.get('limit')) || 15, 100);
  const region = params.get('region') ?? '';
  const period = params.get('period') ?? '';
  const amountMin = Number(params.get('amount_min')) || 0;
  const amountMax = Number(params.get('amount_max')) || 0;

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('decp_attributions')
      .select('id, title, buyer_name, winner_name, amount, notification_date, cpv_code, region, offers_received')
      .eq('cpv_sector', cpv)
      .order('notification_date', { ascending: false })
      .limit(limit);

    if (region) {
      query = query.eq('region', region);
    }

    if (period && period !== 'all') {
      const months = Number(period);
      if (months > 0) {
        const since = new Date();
        since.setMonth(since.getMonth() - months);
        query = query.gte('notification_date', since.toISOString().split('T')[0]);
      }
    }

    if (amountMin > 0) {
      query = query.gte('amount', amountMin);
    }
    if (amountMax > 0) {
      query = query.lte('amount', amountMax);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());
    const fmtSiret = (s: string) => {
      const t = s.trim();
      if (t.length === 14) return `SIRET ${t.slice(0, 3)} ${t.slice(3, 6)} ${t.slice(6, 9)} ${t.slice(9)}`;
      return `SIRET ${t}`;
    };

    const attributions = (data ?? []).map((r) => ({
      id: r.id,
      rfpTitle: r.title,
      buyerName: isSiret(r.buyer_name) ? fmtSiret(r.buyer_name) : r.buyer_name,
      winnerName: isSiret(r.winner_name) ? fmtSiret(r.winner_name) : r.winner_name,
      amount: Number(r.amount) || 0,
      notificationDate: r.notification_date,
      cpvCode: r.cpv_code,
      region: r.region,
      offersReceived: Number(r.offers_received) || undefined,
    }));

    const res = NextResponse.json({ attributions });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
