import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getSupabase } from '@/lib/supabase';

const SIRENE_API = 'https://recherche-entreprises.api.gouv.fr/search';

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function resolveSiren(siren: string): Promise<string | null> {
  try {
    const body = await httpGet(`${SIRENE_API}?q=${siren}&page=1&per_page=1`);
    const json = JSON.parse(body);
    return json.results?.[0]?.nom_complet ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 50, 100);

  try {
    const supabase = getSupabase();

    const { data: buyerRows } = await supabase
      .from('decp_attributions')
      .select('buyer_name');

    const { data: winnerRows } = await supabase
      .from('decp_attributions')
      .select('winner_name');

    // Count frequency of numeric names (unresolved SIRETs)
    const freq = new Map<string, number>();
    const siretPattern = /^\d{9,14}$/;

    for (const r of buyerRows ?? []) {
      const v = r.buyer_name as string;
      if (v && siretPattern.test(v)) freq.set(v, (freq.get(v) ?? 0) + 1);
    }
    for (const r of winnerRows ?? []) {
      const v = r.winner_name as string;
      if (v && siretPattern.test(v)) freq.set(v, (freq.get(v) ?? 0) + 1);
    }

    const topSirets = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([siret]) => siret);

    if (topSirets.length === 0) {
      return NextResponse.json({ resolved: 0, message: 'No SIRETs to resolve' });
    }

    // Resolve SIRETs in batches of 3
    const cache = new Map<string, string>();
    for (let i = 0; i < topSirets.length; i += 3) {
      const batch = topSirets.slice(i, i + 3);
      const results = await Promise.all(
        batch.map((s) => resolveSiren(s.substring(0, 9))),
      );
      for (let j = 0; j < batch.length; j++) {
        if (results[j]) cache.set(batch[j], results[j]!);
      }
    }

    // Update in Supabase
    let updated = 0;
    for (const [siret, name] of cache) {
      const { count: bc } = await supabase
        .from('decp_attributions')
        .update({ buyer_name: name }, { count: 'exact' })
        .eq('buyer_name', siret);

      const { count: wc } = await supabase
        .from('decp_attributions')
        .update({ winner_name: name }, { count: 'exact' })
        .eq('winner_name', siret);

      updated += (bc ?? 0) + (wc ?? 0);
    }

    return NextResponse.json({
      resolved: cache.size,
      attempted: topSirets.length,
      rowsUpdated: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
