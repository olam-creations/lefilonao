import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
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
      .select('id, title, buyer_name, winner_name, amount, notification_date, cpv_code, region')
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const attributions = (data ?? []).map((r) => ({
      id: r.id,
      rfpTitle: r.title,
      buyerName: r.buyer_name,
      winnerName: r.winner_name,
      amount: Number(r.amount) || 0,
      notificationDate: r.notification_date,
      cpvCode: r.cpv_code,
      region: r.region,
    }));

    return NextResponse.json({ attributions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
