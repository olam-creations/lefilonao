import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { getSupabase } from '@/lib/supabase';

/** GET: return current session info (email, displayName, plan). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ authenticated: false });
  }

  const { email } = auth.auth;

  const supabase = getSupabase();
  const { data } = await supabase
    .from('user_settings')
    .select('display_name, plan, first_name')
    .eq('user_email', email)
    .single();

  // Update last_visit_at (fire-and-forget for briefing delta tracking)
  supabase
    .from('user_settings')
    .update({ last_visit_at: new Date().toISOString() })
    .eq('user_email', email)
    .then(() => {});

  return NextResponse.json({
    authenticated: true,
    email,
    displayName: data?.display_name || data?.first_name || '',
    plan: data?.plan || 'free',
  });
}
