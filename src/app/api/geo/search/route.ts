import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

const GEO_API = 'https://geo.api.gouv.fr/communes';

interface GeoCommune {
  nom?: string;
  code?: string;
  codesPostaux?: string[];
  departement?: { code?: string; nom?: string };
  region?: { code?: string; nom?: string };
  centre?: { type?: string; coordinates?: number[] };
}

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const q = params.get('q') ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'q requis (min 2 caracteres)' }, { status: 400 });
  }

  try {
    const url = `${GEO_API}?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux,departement,region,centre&limit=10`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'API Geo indisponible' }, { status: 502 });
    }

    const communes = (await res.json()) as GeoCommune[];

    const results = communes.map((c) => ({
      nom: c.nom ?? '',
      code: c.code ?? '',
      codesPostaux: c.codesPostaux ?? [],
      departement: c.departement?.nom ?? '',
      departementCode: c.departement?.code ?? '',
      region: c.region?.nom ?? '',
      regionCode: c.region?.code ?? '',
      latitude: c.centre?.coordinates?.[1] ?? null,
      longitude: c.centre?.coordinates?.[0] ?? null,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
