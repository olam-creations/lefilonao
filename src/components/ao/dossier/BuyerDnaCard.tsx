'use client';

import { useState, useEffect } from 'react';
import { Building2, Shield, Loader2 } from 'lucide-react';
import BuyerIntelCard from '@/components/intel/BuyerIntelCard';
import BuyerPreferenceHeatmap from '@/components/intel/BuyerPreferenceHeatmap';
import type { BuyerProfile } from '@/components/market/types';

interface BuyerDnaCardProps {
  buyerName: string;
  buyerSiret: string | null;
}

interface CompanyHealthData {
  alerts: { type: string; date: string; description: string }[];
  score: number;
}

function HealthBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-50 text-emerald-700' : score >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';
  const label = score >= 70 ? 'Sain' : score >= 40 ? 'A surveiller' : 'Risque';

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${color}`}>
      {label} ({score}/100)
    </span>
  );
}

export default function BuyerDnaCard({ buyerName, buyerSiret }: BuyerDnaCardProps) {
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [companyHealth, setCompanyHealth] = useState<CompanyHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requests: Promise<void>[] = [];

    // Use local Supabase-powered /api/market/buyer (rich data)
    // instead of FastAPI proxy /api/market/buyer-profile (often empty for name-only)
    const buyerParam = buyerSiret
      ? `siret=${encodeURIComponent(buyerSiret)}`
      : `name=${encodeURIComponent(buyerName)}`;

    requests.push(
      fetch(`/api/market/buyer?${buyerParam}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.buyer) setBuyerProfile(d.buyer); })
        .catch(() => {}),
    );

    if (buyerSiret) {
      requests.push(
        fetch(`/api/market/company-health?siret=${encodeURIComponent(buyerSiret)}`)
          .then((r) => r.ok ? r.json() : null)
          .then((d) => { if (d) setCompanyHealth(d); })
          .catch(() => {}),
      );
    }

    Promise.allSettled(requests).finally(() => setLoading(false));
  }, [buyerName, buyerSiret]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-2 justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Chargement profil acheteur...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">ADN Acheteur</h3>
        <span className="text-xs text-slate-400 truncate max-w-[200px]">{buyerName}</span>
      </div>

      {/* Company health */}
      {companyHealth && (
        <div className="flex items-center gap-3">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-600">Sante financiere:</span>
          <HealthBadge score={companyHealth.score} />
          {companyHealth.alerts.length > 0 && (
            <span className="text-[10px] text-amber-600">
              {companyHealth.alerts.length} alerte(s) BODACC
            </span>
          )}
        </div>
      )}

      {/* Buyer intel from attribution data */}
      {buyerProfile && <BuyerIntelCard data={buyerProfile} />}

      {/* Buyer preferences heatmap */}
      <BuyerPreferenceHeatmap buyers={[buyerName]} />
    </div>
  );
}
