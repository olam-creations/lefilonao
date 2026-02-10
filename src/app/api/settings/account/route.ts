import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function DELETE(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const supabase = getSupabase();

  try {
    // Delete in order: alerts (cascade handles alert_matches), rfps, watchlist, credentials, settings
    const tables = [
      'founder_feedback',
      'ao_pipeline',
      'user_alerts',
      'user_rfps',
      'user_watchlist',
      'platform_credentials',
      'user_settings',
    ] as const;

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_email', email);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression du compte' }, { status: 500 });
  }
}
