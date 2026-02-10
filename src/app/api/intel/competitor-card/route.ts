import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { requireFeature } from '@/lib/require-plan';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

const SIRET_RE = /^\d{9,14}$/;

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const gated = await requireFeature(auth.auth.email, 'buyer-intelligence');
  if (gated) return gated;

  const params = req.nextUrl.searchParams;
  const name = params.get('name') ?? '';
  const siret = params.get('siret') ?? '';

  if (!name && !siret) {
    return NextResponse.json({ error: 'Parametre name ou siret requis' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Fetch competitor's awards
    let query = supabase
      .from('decp_attributions')
      .select('id, title, buyer_name, winner_name, winner_siret, amount, notification_date, cpv_code, cpv_sector, region, offers_received')
      .order('notification_date', { ascending: false })
      .limit(5000);

    if (siret) {
      query = query.eq('winner_siret', siret);
    } else {
      query = query.ilike('winner_name', `%${name}%`);
    }

    const { data: awards, error } = await query;
    if (error) throw error;

    if (!awards || awards.length === 0) {
      return NextResponse.json({ competitor: null });
    }

    // Aggregate stats
    const totalWins = awards.length;
    const totalVolume = awards.reduce((sum, a) => sum + (a.amount ?? 0), 0);
    const avgContract = totalWins > 0 ? Math.round(totalVolume / totalWins) : 0;

    // Win rate from offers_received
    const withOffers = awards.filter((a) => a.offers_received && a.offers_received > 0);
    const totalOffers = withOffers.reduce((sum, a) => sum + (a.offers_received ?? 0), 0);
    const winRate = totalOffers > 0 ? Math.round((withOffers.length / totalOffers) * 100) : null;

    // Top buyers
    const buyerMap = new Map<string, number>();
    for (const a of awards) {
      if (a.buyer_name && !SIRET_RE.test(a.buyer_name)) {
        buyerMap.set(a.buyer_name, (buyerMap.get(a.buyer_name) ?? 0) + 1);
      }
    }
    const topBuyers = Array.from(buyerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([bName, count]) => ({ name: bName, count }));

    // Sectors
    const sectorMap = new Map<string, number>();
    for (const a of awards) {
      if (a.cpv_sector) sectorMap.set(a.cpv_sector, (sectorMap.get(a.cpv_sector) ?? 0) + 1);
    }
    const sectors = Array.from(sectorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));

    // Regions
    const regionMap = new Map<string, number>();
    for (const a of awards) {
      if (a.region) regionMap.set(a.region, (regionMap.get(a.region) ?? 0) + 1);
    }
    const regions = Array.from(regionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([rName, count]) => ({ name: rName, count }));

    // Find user's overlap (how many of user's watched buyers also awarded to this competitor)
    const { data: watchlist } = await supabase
      .from('user_watchlist')
      .select('buyer_name')
      .eq('user_email', auth.auth.email);

    const watchedNames = new Set((watchlist ?? []).map((w) => w.buyer_name));
    const commonBuyers = topBuyers.filter((b) => watchedNames.has(b.name));

    // Threat level
    const threatLevel = commonBuyers.length >= 3 && (winRate ?? 0) > 30
      ? 'high'
      : commonBuyers.length >= 1 || (winRate ?? 0) >= 15
        ? 'medium'
        : 'low';

    const competitorName = awards[0].winner_name ?? name;
    const competitorSiret = awards[0].winner_siret ?? siret;

    const res = NextResponse.json({
      competitor: {
        name: competitorName,
        siret: competitorSiret,
        totalWins,
        totalVolume,
        avgContract,
        winRate,
        topBuyers,
        sectors,
        regions,
        commonBuyers: commonBuyers.length,
        threatLevel,
        recentAwards: awards.slice(0, 5).map((a) => ({
          title: a.title,
          buyerName: a.buyer_name,
          amount: a.amount,
          date: a.notification_date,
        })),
      },
    });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
