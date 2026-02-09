import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const CATEGORIES = ['bug', 'idea', 'other'] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, category, message, pageUrl } = body;

    if (!email || !category || !message) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message trop long (2000 caractères max)' }, { status: 400 });
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
