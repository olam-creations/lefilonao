import { formatAmount } from '@/components/market/utils';
import type { RFP } from '@/hooks/useDashboardFilters';

export interface BoampNoticeData {
  id: string;
  title: string;
  buyer_name: string;
  buyer_siret: string | null;
  cpv_code: string | null;
  cpv_sector: string | null;
  deadline: string | null;
  publication_date: string | null;
  dce_url: string | null;
  region: string | null;
  departement: string | null;
  nature: string | null;
  procedure_type: string | null;
  lots_count: number;
  estimated_amount: number | null;
  description: string | null;
  source: string | null;
  is_open: boolean;
  type_marche: string | null;
  all_cpv_codes: string[] | null;
  all_departements: string[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  duration_months: number | null;
  criteria: string | null;
  buyer_city: string | null;
  buyer_postal_code: string | null;
  contact_name: string | null;
  is_alloti: boolean | null;
  variantes_autorisees: boolean | null;
  cautionnement: string | null;
  modalites_paiement: string | null;
  forme_juridique: string | null;
  date_envoi_publication: string | null;
}

type BoampNotice = BoampNoticeData;

interface UserRfpOverrides {
  score?: number;
  score_label?: 'GO' | 'MAYBE' | 'PASS';
}

export function noticeToRfp(notice: BoampNotice, overrides?: UserRfpOverrides): RFP {
  const budget = notice.estimated_amount && notice.estimated_amount > 0
    ? formatAmount(notice.estimated_amount)
    : null;

  return {
    id: notice.id,
    title: notice.title,
    issuer: notice.buyer_name,
    deadline: notice.deadline,
    score: overrides?.score ?? 50,
    scoreLabel: overrides?.score_label ?? 'MAYBE',
    budget,
    region: notice.region,
    source: notice.source ?? 'BOAMP',
    url: notice.dce_url ?? `https://www.boamp.fr/avis/detail/${notice.id}`,
    publishedAt: notice.publication_date ?? new Date().toISOString(),
  };
}
