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
  const limit = Math.min(Number(params.get('limit')) || 20, 50);
  const offset = Number(params.get('offset')) || 0;

  try {
    const supabase = getSupabase();

    // Fetch user's watched buyers
    const { data: watchlist } = await supabase
      .from('user_watchlist')
      .select('buyer_name')
      .eq('user_email', auth.auth.email);

    const watchedBuyers = (watchlist ?? []).map((w) => w.buyer_name);

    // Fetch user's preference sectors
    const { data: settings } = await supabase
      .from('user_settings')
      .select('default_cpv, default_regions')
      .eq('user_email', auth.auth.email)
      .single();

    const userCpv = settings?.default_cpv ?? [];
    const userRegions = settings?.default_regions ?? [];

    // Recent awards (watched buyers + user sectors)
    let query = supabase
      .from('decp_attributions')
      .select('id, title, buyer_name, winner_name, amount, notification_date, cpv_code, cpv_sector, region')
      .order('notification_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by watched buyers OR matching sectors
    if (watchedBuyers.length > 0) {
      query = query.in('buyer_name', watchedBuyers);
    } else if (userCpv.length > 0) {
      query = query.in('cpv_sector', userCpv.map((c: string) => c.substring(0, 2)));
    }

    const { data: attributions, error } = await query;
    if (error) throw error;

    // Build feed items
    type FeedItemType = 'award' | 'new_tender' | 'competitor_win';

    interface FeedItem {
      id: string;
      type: FeedItemType;
      buyerName: string;
      title: string;
      amount: number | null;
      date: string;
      winnerName?: string;
      region?: string;
      cpvSector?: string;
      isWatched: boolean;
    }

    const feed: FeedItem[] = (attributions ?? []).map((a) => ({
      id: a.id,
      type: 'award' as FeedItemType,
      buyerName: a.buyer_name ?? '',
      title: a.title ?? '',
      amount: a.amount,
      date: a.notification_date ?? '',
      winnerName: a.winner_name ?? '',
      region: a.region ?? '',
      cpvSector: a.cpv_sector ?? '',
      isWatched: watchedBuyers.includes(a.buyer_name),
    }));

    const res = NextResponse.json({ feed, total: feed.length });
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res;
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
