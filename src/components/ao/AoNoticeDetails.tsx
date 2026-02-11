'use client';

import { ExternalLink, FileDown, Building2, Hash, MapPin, Calendar, Package, Tag } from 'lucide-react';
import { formatDate } from '@/lib/ao-utils';
import type { BoampNoticeData } from '@/lib/notice-transform';

interface AoNoticeDetailsProps {
  notice: BoampNoticeData;
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'green' | 'red' }) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium';
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    red: 'bg-red-50 text-red-600 border border-red-200',
  };
  return <span className={`${base} ${styles[variant]}`}>{children}</span>;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <span className="text-sm text-slate-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}

export default function AoNoticeDetails({ notice }: AoNoticeDetailsProps) {
  const boampUrl = `https://www.boamp.fr/avis/detail/${notice.id}`;
  const hasDceUrl = notice.dce_url && !notice.dce_url.includes('boamp.fr');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Informations du marche</h2>

      <div className="flex flex-wrap gap-2 mb-5">
        {notice.nature && <Badge>{notice.nature}</Badge>}
        {notice.procedure_type && <Badge>{notice.procedure_type}</Badge>}
        <Badge variant={notice.is_open ? 'green' : 'red'}>
          {notice.is_open ? 'Ouvert' : 'Clos'}
        </Badge>
      </div>

      {notice.description && (
        <div className="mb-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Description</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line line-clamp-6">
            {notice.description}
          </p>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        <InfoRow icon={Building2} label="Acheteur" value={notice.buyer_name} />
        {notice.buyer_siret && (
          <InfoRow
            icon={Hash}
            label="SIRET"
            value={
              <a
                href={`https://pappers.fr/entreprise/${notice.buyer_siret}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
              >
                {notice.buyer_siret}
              </a>
            }
          />
        )}
        {notice.cpv_code && (
          <InfoRow icon={Tag} label="CPV" value={`${notice.cpv_code}${notice.cpv_sector ? ` — ${notice.cpv_sector}` : ''}`} />
        )}
        {notice.lots_count > 1 && (
          <InfoRow icon={Package} label="Lots" value={`${notice.lots_count} lots`} />
        )}
        {notice.departement && (
          <InfoRow icon={MapPin} label="Departement" value={notice.departement} />
        )}
        <InfoRow icon={Calendar} label="Publie le" value={formatDate(notice.publication_date)} />
        <InfoRow icon={Calendar} label="Limite" value={formatDate(notice.deadline)} />
      </div>

      <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-100">
        <a
          href={boampUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Voir sur le BOAMP
        </a>
        {hasDceUrl && (
          <a
            href={notice.dce_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            Telecharger DCE
          </a>
        )}
      </div>
    </div>
  );
}
