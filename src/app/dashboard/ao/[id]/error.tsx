'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

export default function AoDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Erreur de chargement de l&apos;appel d&apos;offres
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Impossible de charger les détails. Veuillez réessayer.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary text-sm py-2.5 px-6">
            Réessayer
          </button>
          <Link href="/dashboard" className="btn-secondary text-sm py-2.5 px-6">
            Retour au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
