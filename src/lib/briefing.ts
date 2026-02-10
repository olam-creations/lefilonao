import type { SupabaseClient } from '@supabase/supabase-js';

export interface BriefingDelta {
  newAoCount: number;
  topNewAo: { id: string; title: string; score: number } | null;
  newAttributions: Array<{
    buyerName: string;
    title: string;
    winnerName: string;
    amount: number;
    userInvolved: boolean;
  }>;
  watchlistActivity: number;
}

export interface BriefingPriority {
  type: 'deadline' | 'high-score' | 'profile' | 'alert';
  title: string;
  subtitle: string;
  urgency: 'high' | 'medium' | 'low';
  actionUrl: string;
  actionLabel: string;
  estimatedMinutes?: number;
}

export interface BriefingWeekStatus {
  activeResponses: number;
  deadlinesThisWeek: number;
  missedDeadlines: number;
}

export interface BriefingTip {
  text: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface BriefingResponse {
  greeting: string;
  lastVisit: string | null;
  delta: BriefingDelta;
  priorities: BriefingPriority[];
  weekStatus: BriefingWeekStatus;
  tip: BriefingTip;
  isCalm: boolean;
}

const TIPS: BriefingTip[] = [
  {
    text: 'Les entreprises avec des références locales gagnent 35% plus souvent.',
    actionUrl: '/dashboard/profile',
    actionLabel: 'Ajouter des références',
  },
  {
    text: 'Analysez le DCE dès publication pour maximiser votre temps de préparation.',
    actionUrl: '/dashboard',
    actionLabel: 'Voir les AO',
  },
  {
    text: 'Un mémoire personnalisé avec des chiffres précis se démarque toujours.',
  },
  {
    text: 'Suivez vos acheteurs récurrents pour ne jamais manquer leurs nouveaux marchés.',
    actionUrl: '/dashboard/watchlist',
    actionLabel: 'Gérer ma watchlist',
  },
  {
    text: 'Les marchés < 40K€ (MAPA) ont souvent moins de concurrence.',
  },
  {
    text: 'Complétez votre profil à 100% pour des mémoires techniques plus pertinents.',
    actionUrl: '/dashboard/profile',
    actionLabel: 'Compléter mon profil',
  },
  {
    text: 'Consultez l\'intelligence marché pour connaître les habitudes de chaque acheteur.',
    actionUrl: '/dashboard/market',
    actionLabel: 'Intelligence marché',
  },
];

function getDailyTip(): BriefingTip {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TIPS[dayOfYear % TIPS.length];
}

function scorePriority(item: BriefingPriority): number {
  let score = 0;

  if (item.urgency === 'high') score += 100;
  else if (item.urgency === 'medium') score += 50;
  else score += 10;

  if (item.type === 'deadline') score += 30;
  if (item.type === 'high-score') score += 20;
  if (item.type === 'alert') score += 15;
  if (item.type === 'profile') score += 5;

  return score;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export async function assembleBriefing(
  supabase: SupabaseClient,
  email: string,
  displayName: string,
): Promise<BriefingResponse> {
  // Fetch user settings (last_visit_at, preferences)
  const { data: settings } = await supabase
    .from('user_settings')
    .select('last_visit_at, default_cpv, default_regions')
    .eq('user_email', email)
    .single();

  const lastVisit = settings?.last_visit_at ?? null;
  const sinceDate = lastVisit
    ? new Date(lastVisit).toISOString()
    : new Date(Date.now() - 86400000).toISOString(); // Default: last 24h

  const userCpv = settings?.default_cpv ?? [];
  const userRegions = settings?.default_regions ?? [];

  // Run all queries in parallel
  const [
    rfpsResult,
    newAosResult,
    watchlistResult,
    attributionsResult,
    alertMatchesResult,
  ] = await Promise.all([
    // 1. User pipeline (RFPs with notices)
    supabase
      .from('user_rfps')
      .select('id, notice_id, score, score_label, status, boamp_notices(id, title, deadline, buyer_name, estimated_amount)')
      .eq('user_email', email),

    // 2. New AOs matching preferences (since last visit)
    buildNewAosQuery(supabase, sinceDate, userCpv, userRegions),

    // 3. Watchlist buyer names
    supabase
      .from('user_watchlist')
      .select('buyer_name, buyer_siret')
      .eq('user_email', email),

    // 4. Recent attributions from watched buyers
    supabase
      .from('decp_attributions')
      .select('title, buyer_name, winner_name, amount, notification_date')
      .gte('notification_date', sinceDate.split('T')[0])
      .order('notification_date', { ascending: false })
      .limit(20),

    // 5. User alert IDs (for unseen match count)
    supabase
      .from('user_alerts')
      .select('id')
      .eq('user_email', email)
      .eq('active', true),
  ]);

  const rfps = rfpsResult.data ?? [];
  const newAos = newAosResult.data ?? [];
  const watchlist = watchlistResult.data ?? [];
  const recentAttributions = attributionsResult.data ?? [];
  const userAlertIds = (alertMatchesResult.data ?? []).map((a: { id: string }) => a.id);

  // Count unseen alert matches (separate query to avoid subquery typing issue)
  let unseenAlerts = 0;
  if (userAlertIds.length > 0) {
    const { count } = await supabase
      .from('alert_matches')
      .select('id', { count: 'exact', head: true })
      .eq('seen', false)
      .in('alert_id', userAlertIds);
    unseenAlerts = count ?? 0;
  }

  const watchedBuyerNames = new Set(watchlist.map((w) => w.buyer_name));
  const userNoticeIds = new Set(rfps.map((r) => r.notice_id));

  // Build delta
  const watchlistAttributions = recentAttributions.filter(
    (a) => watchedBuyerNames.has(a.buyer_name)
  );

  const topNewAo = newAos.length > 0
    ? { id: newAos[0].id, title: newAos[0].title, score: 0 }
    : null;

  const delta: BriefingDelta = {
    newAoCount: newAos.length,
    topNewAo,
    newAttributions: watchlistAttributions.slice(0, 5).map((a) => ({
      buyerName: a.buyer_name ?? '',
      title: a.title ?? '',
      winnerName: a.winner_name ?? '',
      amount: Number(a.amount) || 0,
      userInvolved: false,
    })),
    watchlistActivity: watchlistAttributions.length,
  };

  // Build priorities
  const priorities: BriefingPriority[] = [];
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);

  for (const rfp of rfps) {
    const notice = rfp.boamp_notices as unknown as { id: string; title: string; deadline: string; buyer_name: string; estimated_amount: number } | null;
    if (!notice?.deadline) continue;

    const days = daysUntil(notice.deadline);
    if (days < 0) continue;

    if (days <= 7) {
      priorities.push({
        type: 'deadline',
        title: notice.title?.slice(0, 80) ?? 'AO sans titre',
        subtitle: days <= 1
          ? 'Deadline demain !'
          : `Deadline dans ${days} jours`,
        urgency: days <= 2 ? 'high' : days <= 5 ? 'medium' : 'low',
        actionUrl: `/dashboard/ao/${notice.id}`,
        actionLabel: 'Continuer',
        estimatedMinutes: 30,
      });
    }
  }

  // High-score new AOs not in pipeline
  for (const ao of newAos.slice(0, 3)) {
    if (!userNoticeIds.has(ao.id)) {
      priorities.push({
        type: 'high-score',
        title: ao.title?.slice(0, 80) ?? 'Nouvel AO',
        subtitle: `Nouveau — ${ao.buyer_name ?? 'Acheteur inconnu'}`,
        urgency: 'medium',
        actionUrl: `/dashboard/ao/${ao.id}`,
        actionLabel: 'Voir',
      });
    }
  }

  // Unread alerts
  if (unseenAlerts > 0) {
    priorities.push({
      type: 'alert',
      title: `${unseenAlerts} alerte${unseenAlerts > 1 ? 's' : ''} non lue${unseenAlerts > 1 ? 's' : ''}`,
      subtitle: 'Nouvelles correspondances détectées',
      urgency: unseenAlerts > 3 ? 'medium' : 'low',
      actionUrl: '/dashboard/veille',
      actionLabel: 'Voir les alertes',
    });
  }

  // Sort by priority score, take top 5
  priorities.sort((a, b) => scorePriority(b) - scorePriority(a));
  const topPriorities = priorities.slice(0, 5);

  // Week status
  const activeStatuses = new Set(['new', 'analyzing', 'go']);
  const activeResponses = rfps.filter((r) => activeStatuses.has(r.status ?? '')).length;

  const deadlinesThisWeek = rfps.filter((r) => {
    const notice = r.boamp_notices as unknown as { deadline: string } | null;
    if (!notice?.deadline) return false;
    const d = new Date(notice.deadline);
    return d >= now && d <= weekFromNow;
  }).length;

  const missedDeadlines = rfps.filter((r) => {
    const notice = r.boamp_notices as unknown as { deadline: string } | null;
    if (!notice?.deadline) return false;
    return new Date(notice.deadline) < now && r.status !== 'submitted' && r.status !== 'won' && r.status !== 'lost';
  }).length;

  const weekStatus: BriefingWeekStatus = {
    activeResponses,
    deadlinesThisWeek,
    missedDeadlines,
  };

  // Determine calm state
  const isCalm = topPriorities.every((p) => p.urgency === 'low') && delta.newAoCount === 0;

  // Greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const name = displayName || email.split('@')[0];
  const greeting = `${timeGreeting} ${name}`;

  return {
    greeting,
    lastVisit,
    delta,
    priorities: topPriorities,
    weekStatus,
    tip: getDailyTip(),
    isCalm,
  };
}

function buildNewAosQuery(
  supabase: SupabaseClient,
  sinceDate: string,
  userCpv: string[],
  userRegions: string[],
) {
  let query = supabase
    .from('boamp_notices')
    .select('id, title, buyer_name, deadline, region, cpv_sector, estimated_amount, publication_date')
    .gte('publication_date', sinceDate.split('T')[0])
    .eq('is_open', true)
    .order('publication_date', { ascending: false })
    .limit(20);

  if (userCpv.length > 0) {
    query = query.in('cpv_sector', userCpv);
  }
  if (userRegions.length > 0) {
    query = query.in('region', userRegions);
  }

  return query;
}
