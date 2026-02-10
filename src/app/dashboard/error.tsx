'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function DashboardError({
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
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Le tableau de bord a rencontré un problème. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="btn-primary text-sm py-2.5 px-6"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
