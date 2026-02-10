import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { getSupabase } from '@/lib/supabase';
import { assembleBriefing } from '@/lib/briefing';

export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { email } = auth.auth;

  try {
    const supabase = getSupabase();

    // Fetch display name for greeting
    const { data: user } = await supabase
      .from('user_settings')
      .select('display_name, first_name')
      .eq('user_email', email)
      .single();

    const displayName = user?.display_name || user?.first_name || '';
    const briefing = await assembleBriefing(supabase, email, displayName);

    // Update last_visit_at (fire-and-forget)
    supabase
      .from('user_settings')
      .update({ last_visit_at: new Date().toISOString() })
      .eq('user_email', email)
      .then(() => {});

    return NextResponse.json(briefing, {
      headers: { 'Cache-Control': 'private, s-maxage=300' },
    });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
