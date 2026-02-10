import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { getSupabase } from '@/lib/supabase';

const ENRICH_LIMIT = { limit: 10, windowSeconds: 60 };

const inputSchema = z.object({
  siret: z.string().regex(/^\d{9,14}$/, 'SIRET (14 chiffres) ou SIREN (9 chiffres) attendu'),
});

export interface CompanyEnrichment {
  siret: string;
  siren: string;
  name: string;
  naf_code: string;
  naf_label: string;
  effectif: string;
  address: string;
  postal_code: string;
  city: string;
  department: string;
  region: string;
  date_creation: string;
  ca_dernier: number | null;
  is_rge: boolean;
  source: 'local' | 'sirene' | 'pappers';
}

/**
 * POST /api/onboarding/enrich-siret
 * No auth required. Rate limited by IP. Returns enriched company data.
 */
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, ENRICH_LIMIT);
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Normalize: pad SIREN to SIRET if 9 digits
    let { siret } = parsed.data;
    const siren = siret.substring(0, 9);
    if (siret.length === 9) {
      siret = siret + '00000'; // Main establishment NIC
    }

    // Strategy 1: Local DB (companies table, already enriched by Workers)
    const local = await lookupLocal(siren);
    if (local) return NextResponse.json(local);

    // Strategy 2: Sirene API (INSEE)
    const sireneResult = await lookupSirene(siret);
    if (sireneResult) return NextResponse.json(sireneResult);

    // Strategy 3: Pappers API (if key available)
    const pappersResult = await lookupPappers(siren);
    if (pappersResult) return NextResponse.json(pappersResult);

    return NextResponse.json(
      { error: 'Entreprise non trouvée. Vérifiez votre numéro SIRET.' },
      { status: 404 },
    );
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

async function lookupLocal(siren: string): Promise<CompanyEnrichment | null> {
  const supabase = getSupabase();

  // Try exact SIRET first, then SIREN prefix
  const { data } = await supabase
    .from('companies')
    .select('*')
    .like('siret', `${siren}%`)
    .limit(1)
    .single();

  if (!data) return null;

  return {
    siret: data.siret ?? '',
    siren: data.siren ?? siren,
    name: data.name ?? '',
    naf_code: data.naf_code ?? '',
    naf_label: data.naf_label ?? '',
    effectif: data.effectif_label ?? '',
    address: data.adresse ?? '',
    postal_code: data.code_postal ?? '',
    city: data.ville ?? '',
    department: data.departement ?? '',
    region: data.region ?? '',
    date_creation: data.date_creation ?? '',
    ca_dernier: data.ca_dernier ? Number(data.ca_dernier) : null,
    is_rge: data.est_rge ?? false,
    source: 'local',
  };
}

async function lookupSirene(siret: string): Promise<CompanyEnrichment | null> {
  try {
    const res = await fetch(
      `https://api.insee.fr/api-sirene/3.11/siret/${siret}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) return null;

    const json = await res.json();
    const etab = json?.etablissement;
    if (!etab) return null;

    const unite = etab.uniteLegale ?? {};
    const adresse = etab.adresseEtablissement ?? {};
    const period = unite.periodesUniteLegale?.[0] ?? {};

    const denom = unite.denominationUniteLegale
      ?? `${unite.prenom1UniteLegale ?? ''} ${unite.nomUniteLegale ?? ''}`.trim();

    return {
      siret: etab.siret ?? siret,
      siren: etab.siren ?? siret.substring(0, 9),
      name: denom,
      naf_code: period.activitePrincipaleUniteLegale ?? '',
      naf_label: '', // Sirene API doesn't return the NAF label
      effectif: unite.trancheEffectifsUniteLegale ?? '',
      address: [
        adresse.numeroVoieEtablissement,
        adresse.typeVoieEtablissement,
        adresse.libelleVoieEtablissement,
      ].filter(Boolean).join(' '),
      postal_code: adresse.codePostalEtablissement ?? '',
      city: adresse.libelleCommuneEtablissement ?? '',
      department: (adresse.codePostalEtablissement ?? '').substring(0, 2),
      region: '',
      date_creation: unite.dateCreationUniteLegale ?? '',
      ca_dernier: null,
      is_rge: false,
      source: 'sirene',
    };
  } catch {
    return null;
  }
}

async function lookupPappers(siren: string): Promise<CompanyEnrichment | null> {
  const apiKey = process.env.PAPPERS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.pappers.fr/v2/entreprise?siren=${siren}&api_token=${apiKey}`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.siren) return null;

    const siege = data.siege ?? {};

    return {
      siret: siege.siret ?? `${siren}00000`,
      siren: data.siren,
      name: data.nom_entreprise ?? data.denomination ?? '',
      naf_code: data.code_naf ?? '',
      naf_label: data.libelle_code_naf ?? '',
      effectif: data.tranche_effectif ?? '',
      address: siege.adresse_ligne_1 ?? '',
      postal_code: siege.code_postal ?? '',
      city: siege.ville ?? '',
      department: (siege.code_postal ?? '').substring(0, 2),
      region: '',
      date_creation: data.date_creation ?? '',
      ca_dernier: data.chiffre_affaires ? Number(data.chiffre_affaires) : null,
      is_rge: false,
      source: 'pappers',
    };
  } catch {
    return null;
  }
}
