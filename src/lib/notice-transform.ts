import { formatAmount } from '@/components/market/utils';
import type { RFP } from '@/hooks/useDashboardFilters';

interface BoampNotice {
  id: string;
  title: string;
  buyer_name: string;
  estimated_amount: number | null;
  dce_url: string | null;
  publication_date: string | null;
  deadline: string | null;
  region: string | null;
  source: string | null;
}

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
