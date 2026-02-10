import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

const BAN_API = 'https://api-adresse.data.gouv.fr/search/';

interface BanFeature {
  properties?: {
    label?: string;
    score?: number;
    housenumber?: string;
    id?: string;
    type?: string;
    name?: string;
    postcode?: string;
    citycode?: string;
    city?: string;
    context?: string;
    street?: string;
  };
  geometry?: {
    coordinates?: number[];
  };
}

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const q = params.get('q') ?? '';
  const postcode = params.get('postcode') ?? '';
  const citycode = params.get('citycode') ?? '';
  const limit = Math.min(Number(params.get('limit')) || 10, 20);

  if (!q || q.length < 3) {
    return NextResponse.json({ error: 'q requis (min 3 caracteres)' }, { status: 400 });
  }

  try {
    const searchParams = new URLSearchParams({
      q,
      limit: String(limit),
    });
    if (postcode) searchParams.set('postcode', postcode);
    if (citycode) searchParams.set('citycode', citycode);

    const res = await fetch(`${BAN_API}?${searchParams}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'API Adresse indisponible' }, { status: 502 });
    }

    const json = (await res.json()) as { features?: BanFeature[] };

    const results = (json.features ?? []).map((f) => ({
      label: f.properties?.label ?? '',
      score: f.properties?.score ?? 0,
      housenumber: f.properties?.housenumber ?? '',
      name: f.properties?.name ?? '',
      postcode: f.properties?.postcode ?? '',
      citycode: f.properties?.citycode ?? '',
      city: f.properties?.city ?? '',
      context: f.properties?.context ?? '',
      street: f.properties?.street ?? '',
      type: f.properties?.type ?? '',
      latitude: f.geometry?.coordinates?.[1] ?? null,
      longitude: f.geometry?.coordinates?.[0] ?? null,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
