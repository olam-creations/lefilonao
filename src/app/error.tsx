'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function RootError({
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          L&apos;application a rencontr&eacute; un probl&egrave;me inattendu. Veuillez r&eacute;essayer.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary text-sm py-2.5 px-6"
          >
            R&eacute;essayer
          </button>
          <a
            href="/"
            className="btn-secondary text-sm py-2.5 px-6"
          >
            Retour &agrave; l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  );
}
