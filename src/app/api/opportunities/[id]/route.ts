import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { noticeToRfp } from '@/lib/notice-transform';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('boamp_notices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!data) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    return NextResponse.json({
      rfp: noticeToRfp(data),
      notice: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
