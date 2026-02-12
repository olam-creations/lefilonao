export type DceCategory =
  | 'rc' | 'ccap' | 'cctp' | 'bpu' | 'dqe' | 'dpgf' | 'ae'
  | 'dc1' | 'dc2' | 'dc3' | 'dc4'
  | 'plan' | 'annexe' | 'avis' | 'bordereau' | 'memoire' | 'autre';

interface CategoryRule {
  category: DceCategory;
  pattern: RegExp;
}

const RULES: CategoryRule[] = [
  { category: 'rc', pattern: /\b(rc|reglement|rdlc|reglement.*(consultation|candidature))\b/i },
  { category: 'ccap', pattern: /\b(ccap|cahier.*admin|clauses.*admin)/i },
  { category: 'cctp', pattern: /\b(cctp|cahier.*tech|clauses.*tech)/i },
  { category: 'bpu', pattern: /\b(bpu|bordereau.*prix.*unit)/i },
  { category: 'dqe', pattern: /\b(dqe|detail.*quant|devis.*quant)/i },
  { category: 'dpgf', pattern: /\b(dpgf|decomposition.*prix|decomp.*prix)/i },
  { category: 'ae', pattern: /\b(ae|acte.*engagement)/i },
  { category: 'dc1', pattern: /\bdc\s*1\b|lettre.*candidature/i },
  { category: 'dc2', pattern: /\bdc\s*2\b|declaration.*candidat/i },
  { category: 'dc3', pattern: /\bdc\s*3\b|acte.*special/i },
  { category: 'dc4', pattern: /\bdc\s*4\b|lettre.*intention/i },
  { category: 'plan', pattern: /\b(plan|esquisse|schema|carto)/i },
  { category: 'bordereau', pattern: /\b(bordereau|borde|bord)\b/i },
  { category: 'memoire', pattern: /\b(memoire|memo)\b/i },
  { category: 'avis', pattern: /\b(avis|aapc|annonce|publication)\b/i },
  { category: 'annexe', pattern: /\b(annexe|complement|piece.*jointe)/i },
];

/**
 * Platform junk documents that are NOT part of the actual DCE.
 * These are help pages, tutorials, and generic platform assets.
 */
const PLATFORM_JUNK_PATTERNS: RegExp[] = [
  /depot[\s_-]*pli/i,
  /guide[\s_-]*(depot|utilisation|fournisseur|acheteur|plateforme|utilisateur)/i,
  /aide[\s_-]*(depot|reponse|soumission)/i,
  /tutori[ae]l/i,
  /mode[\s_-]*emploi/i,
  /faq[\s_-]*/i,
  /cgu[\s_-]*(plateforme|site|portail)/i,
  /mentions[\s_-]*legales/i,
  /certificat[\s_-]*(eidas|electronique|signature)/i,
  /aws[\s_-]*(solution|achat|france)/i,
  /aw[\s_-]*solutions/i,
  /marches[\s_-]*publics[\s_-]*info/i,
  /achatpublic[\s_-]*(com|fr)/i,
  /maximilien[\s_-]*/i,
  /e[\s_-]*attestation/i,
  /klekoon/i,
  /dematerialisation/i,
  /inscription[\s_-]*fournisseur/i,
];

/** Returns true if the filename looks like a platform help/junk document, not a real DCE file. */
export function isPlatformJunk(filename: string): boolean {
  const normalized = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\-\.]/g, ' ');

  return PLATFORM_JUNK_PATTERNS.some((p) => p.test(normalized));
}

/** Categorize a DCE document by its filename. */
export function categorizeDocument(filename: string): DceCategory {
  const normalized = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[_\-\.]/g, ' ');

  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.category;
    }
  }

  return 'autre';
}

/** Human-readable label for a category. */
export function categoryLabel(category: DceCategory): string {
  const labels: Record<DceCategory, string> = {
    rc: 'RC',
    ccap: 'CCAP',
    cctp: 'CCTP',
    bpu: 'BPU',
    dqe: 'DQE',
    dpgf: 'DPGF',
    ae: 'AE',
    dc1: 'DC1',
    dc2: 'DC2',
    dc3: 'DC3',
    dc4: 'DC4',
    plan: 'Plan',
    annexe: 'Annexe',
    avis: 'Avis',
    bordereau: 'Bordereau',
    memoire: 'Memoire',
    autre: 'Autre',
  };
  return labels[category];
}

/** Color class for a category badge. */
export function categoryColor(category: DceCategory): string {
  const colors: Record<DceCategory, string> = {
    rc: 'bg-blue-100 text-blue-700',
    ccap: 'bg-purple-100 text-purple-700',
    cctp: 'bg-orange-100 text-orange-700',
    bpu: 'bg-emerald-100 text-emerald-700',
    dqe: 'bg-teal-100 text-teal-700',
    dpgf: 'bg-cyan-100 text-cyan-700',
    ae: 'bg-pink-100 text-pink-700',
    dc1: 'bg-indigo-100 text-indigo-700',
    dc2: 'bg-indigo-100 text-indigo-700',
    dc3: 'bg-indigo-100 text-indigo-700',
    dc4: 'bg-indigo-100 text-indigo-700',
    plan: 'bg-amber-100 text-amber-700',
    annexe: 'bg-slate-100 text-slate-700',
    avis: 'bg-rose-100 text-rose-700',
    bordereau: 'bg-lime-100 text-lime-700',
    memoire: 'bg-violet-100 text-violet-700',
    autre: 'bg-gray-100 text-gray-600',
  };
  return colors[category];
}
