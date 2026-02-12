import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { getSupabase } from '@/lib/supabase';
import { getUserPlan } from '@/lib/require-plan';
import { FREE_AO_LIMIT } from '@/lib/features';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** GET: count of AO views this month */
export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const supabase = getSupabase();
  const monthKey = currentMonthKey();

  const { count } = await supabase
    .from('ao_views')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', auth.auth.email)
    .eq('month_key', monthKey);

  const plan = await getUserPlan(auth.auth.email);
  const limit = plan === 'pro' || plan === 'admin' ? null : FREE_AO_LIMIT;
  const viewsThisMonth = count ?? 0;

  return NextResponse.json({
    viewsThisMonth,
    limit,
    remaining: limit !== null ? Math.max(0, limit - viewsThisMonth) : null,
  });
}

/** POST: record a view. Returns 403 if free limit reached. */
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { noticeId } = await req.json();
    if (!noticeId || typeof noticeId !== 'string') {
      return NextResponse.json({ error: 'noticeId requis' }, { status: 400 });
    }

    const supabase = getSupabase();
    const monthKey = currentMonthKey();
    const plan = await getUserPlan(auth.auth.email);

    // Check limit for free users
    if (plan !== 'pro' && plan !== 'admin') {
      const { count } = await supabase
        .from('ao_views')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', auth.auth.email)
        .eq('month_key', monthKey);

      if ((count ?? 0) >= FREE_AO_LIMIT) {
        return NextResponse.json(
          { error: 'Limite mensuelle atteinte', limit: FREE_AO_LIMIT },
          { status: 403 },
        );
      }
    }

    // Upsert (unique constraint prevents duplicates)
    await supabase.from('ao_views').upsert(
      {
        user_email: auth.auth.email,
        notice_id: noticeId,
        month_key: monthKey,
      },
      { onConflict: 'user_email,notice_id,month_key' },
    );

    // Return updated count
    const { count: newCount } = await supabase
      .from('ao_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', auth.auth.email)
      .eq('month_key', monthKey);

    const viewsThisMonth = newCount ?? 0;
    const limit = plan === 'pro' || plan === 'admin' ? null : FREE_AO_LIMIT;

    return NextResponse.json({
      success: true,
      viewsThisMonth,
      limit,
      remaining: limit !== null ? Math.max(0, limit - viewsThisMonth) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
