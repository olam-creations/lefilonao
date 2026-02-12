'use client';

import { ExternalLink, FileDown, Building2, Hash, MapPin, Calendar, Package, Tag, Euro, Clock, User, Mail, Phone, Scale, Layers, FileCheck } from 'lucide-react';
import { formatDate } from '@/lib/ao-utils';
import type { BoampNoticeData } from '@/lib/notice-transform';
import type { BoampEnrichedData } from '@/lib/boamp-enrichment';

export interface BoampLot {
  lot_number: number;
  title: string | null;
  cpv_code: string | null;
  estimated_amount: number | null;
  description: string | null;
}

interface AoNoticeDetailsProps {
  notice: BoampNoticeData;
  lots?: BoampLot[];
  enriched?: BoampEnrichedData | null;
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

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function LotCard({ lot }: { lot: BoampLot }) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h4 className="text-sm font-semibold text-slate-900">
          Lot {lot.lot_number}
          {lot.title ? ` — ${lot.title}` : ''}
        </h4>
        {lot.estimated_amount && lot.estimated_amount > 0 && (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">
            {formatEuro(lot.estimated_amount)}
          </span>
        )}
      </div>
      {lot.description && lot.description !== lot.title && (
        <p className="text-xs text-slate-600 leading-relaxed mt-1 line-clamp-3">{lot.description}</p>
      )}
      {lot.cpv_code && (
        <div className="flex items-center gap-1.5 mt-2">
          <Tag className="w-3 h-3 text-slate-400" />
          <span className="text-[11px] text-slate-500">CPV {lot.cpv_code}</span>
        </div>
      )}
    </div>
  );
}

export default function AoNoticeDetails({ notice, lots = [], enriched }: AoNoticeDetailsProps) {
  const boampUrl = `https://www.boamp.fr/avis/detail/${notice.id}`;
  const hasDceUrl = notice.dce_url && !notice.dce_url.includes('boamp.fr');

  const natureLabel = enriched?.nature_libelle ?? notice.nature;
  const procedureLabel = enriched?.procedure_libelle ?? notice.procedure_type;
  const allCpvCodes = notice.all_cpv_codes ?? [];
  const cpvLabel = notice.cpv_code
    ? `${notice.cpv_code}${allCpvCodes.length > 1 ? ` — ${allCpvCodes.join(', ')}` : enriched?.descripteur_libelle?.length ? ` — ${enriched.descripteur_libelle.join(', ')}` : notice.cpv_sector ? ` — ${notice.cpv_sector}` : ''}`
    : null;

  // Prefer notice-level fields (stored by worker), fall back to enriched (from donnees/API)
  const typeMarche = notice.type_marche ? [notice.type_marche] : enriched?.type_marche ?? [];
  const contactEmail = notice.contact_email ?? enriched?.contact_email;
  const contactPhone = notice.contact_phone ?? enriched?.contact_phone;
  const contactName = notice.contact_name ?? enriched?.contact_name;
  const durationMonths = notice.duration_months ?? enriched?.duration_months;
  const criteria = notice.criteria ?? enriched?.criteria;
  const buyerCity = notice.buyer_city ?? enriched?.buyer_city;
  const buyerPostalCode = notice.buyer_postal_code ?? enriched?.buyer_postal_code;
  const isAlloti = notice.is_alloti ?? enriched?.is_alloti;
  const variantes = notice.variantes_autorisees ?? enriched?.variantes_autorisees;
  const cautionnement = notice.cautionnement ?? enriched?.cautionnement;
  const modalitesPaiement = notice.modalites_paiement ?? enriched?.modalites_paiement;
  const formeJuridique = notice.forme_juridique ?? enriched?.forme_juridique;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Informations du marche</h2>

      <div className="flex flex-wrap gap-2 mb-5">
        {natureLabel && <Badge>{natureLabel}</Badge>}
        {procedureLabel && <Badge>{procedureLabel}</Badge>}
        {typeMarche.map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
        <Badge variant={notice.is_open ? 'green' : 'red'}>
          {notice.is_open ? 'Ouvert' : 'Clos'}
        </Badge>
        {isAlloti != null && (
          <Badge>{isAlloti ? 'Alloti' : 'Non alloti'}</Badge>
        )}
        {variantes && <Badge variant="green">Variantes autorisees</Badge>}
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
        {cpvLabel && (
          <InfoRow icon={Tag} label="CPV" value={cpvLabel} />
        )}
        {notice.estimated_amount && notice.estimated_amount > 0 && (
          <InfoRow icon={Euro} label="Montant" value={formatEuro(notice.estimated_amount)} />
        )}
        {notice.lots_count > 1 && (
          <InfoRow icon={Package} label="Lots" value={`${notice.lots_count} lots`} />
        )}
        {notice.departement && (
          <InfoRow icon={MapPin} label="Departement" value={notice.departement} />
        )}
        {(buyerCity || buyerPostalCode) && (
          <InfoRow
            icon={MapPin}
            label="Localite"
            value={[buyerCity, buyerPostalCode].filter(Boolean).join(' ')}
          />
        )}
        {durationMonths && (
          <InfoRow icon={Clock} label="Duree" value={`${durationMonths} mois`} />
        )}
        {contactName && (
          <InfoRow icon={User} label="Contact" value={contactName} />
        )}
        {formeJuridique && (
          <InfoRow icon={Layers} label="Forme juridique" value={formeJuridique} />
        )}
        {cautionnement && (
          <InfoRow icon={FileCheck} label="Cautionnement" value={cautionnement} />
        )}
        {modalitesPaiement && (
          <InfoRow icon={Euro} label="Paiement" value={modalitesPaiement} />
        )}
        {contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) && (
          <InfoRow
            icon={Mail}
            label="Email"
            value={
              <a href={`mailto:${contactEmail}`} className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                {contactEmail}
              </a>
            }
          />
        )}
        {contactPhone && (
          <InfoRow icon={Phone} label="Telephone" value={contactPhone} />
        )}
        <InfoRow icon={Calendar} label="Publie le" value={formatDate(notice.publication_date)} />
        <InfoRow icon={Calendar} label="Limite" value={formatDate(notice.deadline)} />
      </div>

      {/* Criteria */}
      {criteria && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-400" />
            Criteres d&apos;attribution
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {criteria}
          </p>
        </div>
      )}

      {/* Individual lots */}
      {lots.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            Decomposition en {lots.length} lots
          </h3>
          <div className="space-y-2">
            {lots.map((lot) => (
              <LotCard key={lot.lot_number} lot={lot} />
            ))}
          </div>
        </div>
      )}

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
