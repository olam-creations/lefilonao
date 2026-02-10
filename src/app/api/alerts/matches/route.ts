import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;
  const unseenOnly = req.nextUrl.searchParams.get('unseen') === 'true';
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 50, 200);

  try {
    const supabase = getSupabase();

    // Get user's alert IDs
    const { data: alerts } = await supabase
      .from('user_alerts')
      .select('id, label')
      .eq('user_email', email);

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ matches: [], unseenCount: 0 });
    }

    const alertIds = alerts.map((a) => a.id);
    const alertLabels = new Map(alerts.map((a) => [a.id, a.label ?? 'Alerte']));

    // Fetch matches
    let query = supabase
      .from('alert_matches')
      .select('id, alert_id, notice_id, matched_at, seen, emailed')
      .in('alert_id', alertIds)
      .order('matched_at', { ascending: false })
      .limit(limit);

    if (unseenOnly) {
      query = query.eq('seen', false);
    }

    const { data: matches, error } = await query;
    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    // Fetch notice details for all matches
    const noticeIds = [...new Set((matches ?? []).map((m) => m.notice_id))];
    const { data: notices } = await supabase
      .from('boamp_notices')
      .select('id, title, buyer_name, deadline, dce_url, region, estimated_amount, cpv_sector')
      .in('id', noticeIds);

    const noticeMap = new Map((notices ?? []).map((n) => [n.id, n]));

    // Count unseen
    const { count: unseenCount } = await supabase
      .from('alert_matches')
      .select('*', { count: 'exact', head: true })
      .in('alert_id', alertIds)
      .eq('seen', false);

    const enrichedMatches = (matches ?? []).map((m) => {
      const notice = noticeMap.get(m.notice_id);
      return {
        id: m.id,
        alertId: m.alert_id,
        alertLabel: alertLabels.get(m.alert_id) ?? 'Alerte',
        matchedAt: m.matched_at,
        seen: m.seen,
        notice: notice ? {
          id: notice.id,
          title: notice.title,
          buyerName: notice.buyer_name,
          deadline: notice.deadline,
          dceUrl: notice.dce_url,
          region: notice.region,
          estimatedAmount: Number(notice.estimated_amount) || 0,
          cpvSector: notice.cpv_sector,
        } : null,
      };
    });

    return NextResponse.json({
      matches: enrichedMatches,
      unseenCount: unseenCount ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const rl = rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;

  try {
    const body = await req.json();
    const { id, ids, seen } = body;

    const supabase = getSupabase();

    // Fetch this user's alert IDs to scope updates
    const { data: userAlerts } = await supabase
      .from('user_alerts')
      .select('id')
      .eq('user_email', email);

    const userAlertIds = (userAlerts ?? []).map((a) => a.id);

    if (userAlertIds.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    if (ids && Array.isArray(ids)) {
      // Batch mark as seen — only for matches belonging to user's alerts
      const { error } = await supabase
        .from('alert_matches')
        .update({ seen: seen ?? true })
        .in('id', ids)
        .in('alert_id', userAlertIds);

      if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
      return NextResponse.json({ updated: ids.length });
    }

    if (id) {
      const { error } = await supabase
        .from('alert_matches')
        .update({ seen: seen ?? true })
        .eq('id', id)
        .in('alert_id', userAlertIds);

      if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
      return NextResponse.json({ updated: 1 });
    }

    return NextResponse.json({ error: 'id or ids required' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
