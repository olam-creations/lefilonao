'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SettingsError({
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
          Erreur de chargement des paramètres
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Impossible de charger vos paramètres. Veuillez réessayer.
        </p>
        <button onClick={reset} className="btn-primary text-sm py-2.5 px-6">
          Réessayer
        </button>
      </div>
    </div>
  );
}
