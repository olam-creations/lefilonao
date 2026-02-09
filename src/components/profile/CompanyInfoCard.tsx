'use client';

import { useState } from 'react';
import { Building2, Pencil, Check, X, Phone, Globe, Landmark } from 'lucide-react';
import type { CompanyProfile } from '@/lib/dev';

interface CompanyInfoCardProps {
  profile: CompanyProfile;
  onSave: (updated: CompanyProfile) => void;
}

type StringField = Exclude<{
  [K in keyof CompanyProfile]: CompanyProfile[K] extends string ? K : never;
}[keyof CompanyProfile], undefined>;

const identityFields: { key: StringField; label: string; placeholder: string; half?: boolean }[] = [
  { key: 'companyName', label: 'Raison sociale', placeholder: 'Nom de l\'entreprise' },
  { key: 'siret', label: 'SIRET', placeholder: '123 456 789 00012' },
  { key: 'legalForm', label: 'Forme juridique', placeholder: 'SAS, SARL, EURL...', half: true },
  { key: 'naf', label: 'Code NAF/APE', placeholder: '6201Z', half: true },
  { key: 'tvaIntra', label: 'TVA intracommunautaire', placeholder: 'FR 12 345678901' },
  { key: 'address', label: 'Adresse', placeholder: '42 rue de l\'Innovation' },
  { key: 'postalCode', label: 'Code postal', placeholder: '75011', half: true },
  { key: 'city', label: 'Ville', placeholder: 'Paris', half: true },
];

const contactFields: { key: StringField; label: string; placeholder: string; half?: boolean }[] = [
  { key: 'phone', label: 'Telephone', placeholder: '01 23 45 67 89', half: true },
  { key: 'email', label: 'Email', placeholder: 'contact@entreprise.fr', half: true },
  { key: 'website', label: 'Site web', placeholder: 'https://entreprise.fr' },
];

const financialFields: { key: StringField; label: string; placeholder: string; suffix?: string; half?: boolean }[] = [
  { key: 'capitalSocial', label: 'Capital social', placeholder: '50 000', suffix: '\u20ac', half: true },
  { key: 'effectifTotal', label: 'Effectif total', placeholder: '15', half: true },
  { key: 'caN1', label: `CA ${new Date().getFullYear() - 1}`, placeholder: '1 200 000', suffix: '\u20ac' },
  { key: 'caN2', label: `CA ${new Date().getFullYear() - 2}`, placeholder: '980 000', suffix: '\u20ac', half: true },
  { key: 'caN3', label: `CA ${new Date().getFullYear() - 3}`, placeholder: '750 000', suffix: '\u20ac', half: true },
];

export default function CompanyInfoCard({ profile, onSave }: CompanyInfoCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const handleChange = (field: StringField, value: string) => {
    setDraft({ ...draft, [field]: value });
  };

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const renderField = (f: { key: StringField; label: string; placeholder: string; suffix?: string; half?: boolean }) => (
    <div key={f.key} className={f.half ? '' : 'sm:col-span-2'}>
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 block">{f.label}</label>
      {editing ? (
        <div className="relative">
          <input
            type="text"
            value={String(draft[f.key] || '')}
            onChange={(e) => handleChange(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          {f.suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{f.suffix}</span>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-700 py-2">
          {String(profile[f.key] || '') || <span className="text-slate-300 italic">Non renseigne</span>}
          {f.suffix && profile[f.key] ? ` ${f.suffix}` : ''}
        </p>
      )}
    </div>
  );

  const filledCount = [...identityFields, ...contactFields, ...financialFields].filter(
    (f) => profile[f.key] && String(profile[f.key]).trim() !== '',
  ).length;
  const totalFieldCount = identityFields.length + contactFields.length + financialFields.length;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900">Informations societe</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{filledCount}/{totalFieldCount} remplis</span>
          {!editing ? (
            <button
              onClick={() => { setDraft(profile); setEditing(true); }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={handleSave} className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <Check className="w-4 h-4 text-indigo-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="mb-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" /> Identite
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {identityFields.map(renderField)}
        </div>
      </div>

      {/* Contact */}
      <div className="mb-5 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contactFields.map(renderField)}
        </div>
      </div>

      {/* Financial */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5" /> Donnees financieres
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {financialFields.map(renderField)}
        </div>
      </div>
    </div>
  );
}
