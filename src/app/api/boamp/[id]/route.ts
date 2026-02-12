import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { parseBoampRecord } from '@/lib/boamp-enrichment';

const ID_RE = /^[\w-]+$/;
const BOAMP_API = 'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    // ID is validated to [\w-]+ only — safe for BOAMP WHERE clause
    const url = `${BOAMP_API}?where=idweb='${id}'&limit=1`;
    const res = await fetch(url, { signal: controller.signal, redirect: 'error' });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ enriched: null }, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    }

    const json = await res.json();
    const records = json.results ?? json.records ?? [];
    if (records.length === 0) {
      return NextResponse.json({ enriched: null }, {
        headers: { 'Cache-Control': 'public, max-age=3600' },
      });
    }

    const record = records[0].record ?? records[0];
    const enriched = parseBoampRecord(record);

    return NextResponse.json({ enriched }, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ enriched: null }, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  }
}
