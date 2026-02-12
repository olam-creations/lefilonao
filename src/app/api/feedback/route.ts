import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { feedbackSchema, parseBody } from '@/lib/validators';

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.auth.email;

  try {
    const raw = await req.json();
    const parsed = parseBody(feedbackSchema, raw);
    if (!parsed.ok) return NextResponse.json(JSON.parse(await parsed.response.text()), { status: 400 });

    const { category, message, pageUrl } = parsed.data;

    const supabase = getSupabase();
    const { error } = await supabase
      .from('founder_feedback')
      .insert({
        user_email: email,
        category,
        message: message.trim(),
        page_url: pageUrl ?? null,
      });

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
