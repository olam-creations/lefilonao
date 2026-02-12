import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

/** GET: export all user data for RGPD Article 20 portability */
export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const supabase = getSupabase();

  try {
    const [settings, watchlist, alerts, alertMatches, rfps, credentials, feedback, pipeline] = await Promise.all([
      supabase.from('user_settings').select('*').eq('user_email', email).maybeSingle(),
      supabase.from('user_watchlist').select('*').eq('user_email', email),
      supabase.from('user_alerts').select('*').eq('user_email', email),
      supabase.from('alert_matches').select('*, user_alerts!inner(user_email)').eq('user_alerts.user_email', email),
      supabase.from('user_rfps').select('*').eq('user_email', email),
      supabase.from('platform_credentials').select('id, platform, platform_url, username, created_at, updated_at').eq('user_email', email),
      supabase.from('founder_feedback').select('*').eq('user_email', email),
      supabase.from('ao_pipeline').select('*').eq('user_email', email),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      email,
      user_settings: settings.data ?? null,
      user_watchlist: watchlist.data ?? [],
      user_alerts: alerts.data ?? [],
      alert_matches: alertMatches.data ?? [],
      user_rfps: rfps.data ?? [],
      platform_credentials: credentials.data ?? [],
      founder_feedback: feedback.data ?? [],
      ao_pipeline: pipeline.data ?? [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="lefilonao-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'export des données' }, { status: 500 });
  }
}
