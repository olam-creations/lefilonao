'use client';

import { useState } from 'react';
import { ArrowRight, X, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { TrialInfo } from '@/lib/trial';

interface TrialBannerProps {
  trial: TrialInfo | null;
}

export default function TrialBanner({ trial }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!trial || dismissed) return null;

  // Expired overlay
  if (trial.isExpired) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Essai terminé
          </h2>
          <p className="text-slate-500 mb-8">
            Votre essai gratuit de 14 jours est terminé.
            Abonnez-vous pour continuer à utiliser Le Filon AO.
          </p>
          <Link href="/pricing" className="btn-primary w-full justify-center py-3.5 text-base">
            Choisir une offre
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Warning (5 days or less)
  if (trial.isWarning) {
    return (
      <div className="trial-banner trial-banner-warning mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">
            Votre essai se termine dans {trial.daysRemaining} jour{trial.daysRemaining > 1 ? 's' : ''}
          </span>
        </div>
        <Link
          href="/pricing"
          className="flex items-center gap-1 text-sm font-semibold hover:underline flex-shrink-0"
        >
          S&apos;abonner <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Healthy (6-14 days)
  return (
    <div className="trial-banner trial-banner-healthy mb-6">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>
          Essai gratuit &mdash; Il vous reste <strong>{trial.daysRemaining} jours</strong>
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          href="/pricing"
          className="text-sm font-medium hover:underline"
        >
          Voir l&apos;offre
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-indigo-100 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
