export interface BoampEnrichedData {
  nature_libelle: string | null;
  procedure_libelle: string | null;
  descripteur_libelle: string[];
  type_marche: string[];
  url_avis: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  buyer_city: string | null;
  buyer_postal_code: string | null;
  duration_months: number | null;
  criteria: string | null;
  is_alloti: boolean | null;
  variantes_autorisees: boolean | null;
  cautionnement: string | null;
  modalites_paiement: string | null;
  forme_juridique: string | null;
  date_envoi_publication: string | null;
}

function safeStr(val: unknown): string | null {
  if (typeof val === 'string' && val.trim()) return val.trim();
  return null;
}

function safeArr(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === 'string' && v.trim());
  return [];
}

function safeNum(val: unknown): number | null {
  if (typeof val === 'number' && val > 0) return val;
  if (typeof val === 'string') {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

function parseDonnees(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function deepGet(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function extractCriteria(donnees: Record<string, unknown>): string | null {
  // FNSimple format: various paths for criteria
  const paths = [
    'FNSimple.initial.conditionAttribution.critereAttribution',
    'FNSimple.initial.conditionsAttribution.critereAttribution',
    'FNSimple.conditionAttribution.critereAttribution',
  ];
  for (const path of paths) {
    const val = deepGet(donnees, path);
    if (typeof val === 'string' && val.trim()) return val.trim();
    if (Array.isArray(val)) {
      const texts = val
        .map((v) => (typeof v === 'string' ? v : typeof v === 'object' && v ? JSON.stringify(v) : ''))
        .filter(Boolean);
      if (texts.length > 0) return texts.join('\n');
    }
    if (typeof val === 'object' && val) {
      const text = safeStr((val as Record<string, unknown>).texte)
        ?? safeStr((val as Record<string, unknown>).libelle);
      if (text) return text;
    }
  }
  return null;
}

/**
 * Build enrichment from DB data (notice columns + boamp_donnees JSONB).
 * Used by /api/opportunities/[id] to avoid external BOAMP API call.
 * Fields stored in boamp_notices (contact_email, criteria, etc.) are used directly.
 * Fields only available in the full donnees JSON (contact_name, buyer_city, etc.) are extracted here.
 */
export function buildEnrichmentFromDb(
  notice: Record<string, unknown>,
  donnees: unknown,
): BoampEnrichedData {
  const parsed = parseDonnees(donnees);
  const comm = parsed ? deepGet(parsed, 'FNSimple.initial.communication') as Record<string, unknown> | null : null;
  const org = parsed ? deepGet(parsed, 'FNSimple.organisme') as Record<string, unknown> | null : null;

  // Prefer notice-level columns (already enriched by worker), fall back to donnees extraction
  const typeMarche = notice.type_marche;
  return {
    nature_libelle: safeStr(notice.nature),
    procedure_libelle: safeStr(notice.procedure_type),
    descripteur_libelle: safeArr(notice.all_cpv_codes),
    type_marche: typeof typeMarche === 'string' ? [typeMarche] : safeArr(typeMarche),
    url_avis: safeStr(notice.dce_url),
    contact_name: safeStr(comm?.nomContact)
      ?? safeStr(org?.nom)
      ?? safeStr(deepGet(parsed ?? {}, 'FNSimple.initial.communication.nomContact')),
    contact_email: safeStr(notice.contact_email)
      ?? safeStr(comm?.email),
    contact_phone: safeStr(notice.contact_phone)
      ?? safeStr(comm?.telephone),
    buyer_city: safeStr(org?.ville)
      ?? safeStr(deepGet(parsed ?? {}, 'FNSimple.organisme.ville')),
    buyer_postal_code: safeStr(org?.cp)
      ?? safeStr(deepGet(parsed ?? {}, 'FNSimple.organisme.cp')),
    duration_months: safeNum(notice.duration_months)
      ?? safeNum(deepGet(parsed ?? {}, 'FNSimple.initial.natureMarche.dureeMois'))
      ?? safeNum(deepGet(parsed ?? {}, 'FNSimple.natureMarche.dureeMois')),
    criteria: safeStr(notice.criteria)
      ?? (parsed ? extractCriteria(parsed) : null),
    is_alloti: notice.is_alloti != null ? Boolean(notice.is_alloti) : null,
    variantes_autorisees: notice.variantes_autorisees != null ? Boolean(notice.variantes_autorisees) : null,
    cautionnement: safeStr(notice.cautionnement)
      ?? safeStr(deepGet(parsed ?? {}, 'FNSimple.initial.conditionParticipation.cautionnement')),
    modalites_paiement: safeStr(notice.modalites_paiement)
      ?? safeStr(deepGet(parsed ?? {}, 'FNSimple.initial.conditionParticipation.modalitePaiement')),
    forme_juridique: safeStr(notice.forme_juridique)
      ?? safeStr(deepGet(parsed ?? {}, 'FNSimple.initial.conditionParticipation.formeJuridique')),
    date_envoi_publication: safeStr(notice.date_envoi_publication)
      ?? safeStr(deepGet(parsed ?? {}, 'FNSimple.initial.dateEnvoiPublication')),
  };
}

/** Parse enrichment from raw BOAMP API record (external API proxy fallback). */
export function parseBoampRecord(record: unknown): BoampEnrichedData {
  const r = (record && typeof record === 'object') ? record as Record<string, unknown> : {};
  const donnees = parseDonnees(r.donnees);

  const comm = donnees ? deepGet(donnees, 'FNSimple.initial.communication') as Record<string, unknown> | null : null;
  const org = donnees ? deepGet(donnees, 'FNSimple.organisme') as Record<string, unknown> | null : null;

  return {
    nature_libelle: safeStr(r.nature_libelle),
    procedure_libelle: safeStr(r.procedure_libelle),
    descripteur_libelle: safeArr(r.descripteur_libelle),
    type_marche: safeArr(r.type_marche),
    url_avis: safeStr(r.url_avis),
    contact_name: safeStr(comm?.nomContact)
      ?? safeStr(org?.nom)
      ?? safeStr(deepGet(donnees ?? {}, 'FNSimple.initial.communication.nomContact')),
    contact_email: safeStr(comm?.email)
      ?? safeStr(deepGet(donnees ?? {}, 'FNSimple.initial.communication.email')),
    contact_phone: safeStr(comm?.telephone)
      ?? safeStr(deepGet(donnees ?? {}, 'FNSimple.initial.communication.telephone')),
    buyer_city: safeStr(org?.ville)
      ?? safeStr(deepGet(donnees ?? {}, 'FNSimple.organisme.ville')),
    buyer_postal_code: safeStr(org?.cp)
      ?? safeStr(deepGet(donnees ?? {}, 'FNSimple.organisme.cp')),
    duration_months: safeNum(deepGet(donnees ?? {}, 'FNSimple.initial.natureMarche.dureeMois'))
      ?? safeNum(deepGet(donnees ?? {}, 'FNSimple.natureMarche.dureeMois')),
    criteria: donnees ? extractCriteria(donnees) : null,
    is_alloti: (() => {
      const v = deepGet(donnees ?? {}, 'FNSimple.initial.natureMarche.allotissement');
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() === 'oui' || v === '1';
      return null;
    })(),
    variantes_autorisees: (() => {
      const v = deepGet(donnees ?? {}, 'FNSimple.initial.conditionParticipation.variante');
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() === 'oui' || v === '1';
      return null;
    })(),
    cautionnement: safeStr(deepGet(donnees ?? {}, 'FNSimple.initial.conditionParticipation.cautionnement')),
    modalites_paiement: safeStr(deepGet(donnees ?? {}, 'FNSimple.initial.conditionParticipation.modalitePaiement')),
    forme_juridique: safeStr(deepGet(donnees ?? {}, 'FNSimple.initial.conditionParticipation.formeJuridique')),
    date_envoi_publication: safeStr(deepGet(donnees ?? {}, 'FNSimple.initial.dateEnvoiPublication')),
  };
}
