'use client';

import { useState, useCallback } from 'react';
import { Package, FileDown, Archive, Loader2, Check, AlertTriangle } from 'lucide-react';
import type { CompanyProfile, TechnicalPlanSection, RequiredDocumentDetailed } from '@/lib/dev';
import type { WorkspaceState } from '@/lib/ao-utils';
import { exportDossier } from '@/lib/dossier-export';
import { triggerDownload } from '@/lib/file-storage';

interface DossierExportCardProps {
  profile: CompanyProfile;
  rfp: { title: string; issuer: string; deadline: string; budget: string };
  sections: TechnicalPlanSection[];
  workspace: WorkspaceState;
  documentsDetailed: RequiredDocumentDetailed[];
}

type ActionState = 'idle' | 'loading' | 'done';

async function fetchPdf(type: 'dc1' | 'dc2', profile: CompanyProfile, rfp: { title: string; issuer: string }) {
  const res = await fetch('/api/documents/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, profile, issuer: rfp.issuer, title: rfp.title }),
  });
  if (!res.ok) throw new Error('PDF generation failed');
  return await res.blob();
}

export default function DossierExportCard({
  profile,
  rfp,
  sections,
  workspace,
  documentsDetailed,
}: DossierExportCardProps) {
  const [dc1State, setDc1State] = useState<ActionState>('idle');
  const [dc2State, setDc2State] = useState<ActionState>('idle');
  const [zipState, setZipState] = useState<ActionState>('idle');

  const docsReady = Object.values(workspace.documentsReady).filter(Boolean).length;
  const totalDocs = documentsDetailed.length;
  const sectionsReviewed = Object.values(workspace.sectionsReviewed).filter(Boolean).length;
  const totalSections = sections.length;

  const profileComplete = profile.companyName && profile.siret;

  const handleDC1 = useCallback(async () => {
    setDc1State('loading');
    try {
      const blob = await fetchPdf('dc1', profile, rfp);
      triggerDownload(blob, 'DC1_Lettre_candidature.pdf');
      setDc1State('done');
      setTimeout(() => setDc1State('idle'), 2000);
    } catch {
      setDc1State('idle');
    }
  }, [profile, rfp]);

  const handleDC2 = useCallback(async () => {
    setDc2State('loading');
    try {
      const blob = await fetchPdf('dc2', profile, rfp);
      triggerDownload(blob, 'DC2_Declaration_candidat.pdf');
      setDc2State('done');
      setTimeout(() => setDc2State('idle'), 2000);
    } catch {
      setDc2State('idle');
    }
  }, [profile, rfp]);

  const handleExport = useCallback(async () => {
    setZipState('loading');
    try {
      await exportDossier({ profile, rfp, sections, workspace, documentsDetailed });
      setZipState('done');
      setTimeout(() => setZipState('idle'), 2000);
    } catch {
      setZipState('idle');
    }
  }, [profile, rfp, sections, workspace, documentsDetailed]);

  function ActionButton({
    label,
    icon: Icon,
    state,
    onClick,
    disabled,
    variant = 'default',
  }: {
    label: string;
    icon: typeof FileDown;
    state: ActionState;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'primary';
  }) {
    const baseClass = variant === 'primary'
      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 disabled:from-slate-300 disabled:to-slate-300'
      : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 disabled:text-slate-300 disabled:border-slate-100';

    return (
      <button
        onClick={onClick}
        disabled={disabled || state === 'loading'}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${baseClass}`}
      >
        {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> :
         state === 'done' ? <Check className="w-4 h-4" /> :
         <Icon className="w-4 h-4" />}
        {state === 'loading' ? 'En cours...' : state === 'done' ? 'Fait' : label}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
          <Package className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Dossier de candidature</h2>
          <p className="text-xs text-slate-400">Generez les formulaires et exportez le dossier complet</p>
        </div>
      </div>

      {/* Progress checklist */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <CheckItem label="Profil entreprise" done={!!profileComplete} />
        <CheckItem label={`Documents (${docsReady}/${totalDocs})`} done={docsReady === totalDocs} />
        <CheckItem label={`Memoire (${sectionsReviewed}/${totalSections})`} done={sectionsReviewed === totalSections} />
      </div>

      {!profileComplete && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Completez votre profil entreprise pour pre-remplir les formulaires DC1/DC2
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <ActionButton label="Generer DC1" icon={FileDown} state={dc1State} onClick={handleDC1} />
        <ActionButton label="Generer DC2" icon={FileDown} state={dc2State} onClick={handleDC2} />
        <ActionButton label="Exporter le dossier" icon={Archive} state={zipState} onClick={handleExport} variant="primary" />
      </div>
    </div>
  );
}

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
      done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
    }`}>
      {done ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current" />}
      {label}
    </div>
  );
}
