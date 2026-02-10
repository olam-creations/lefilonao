'use client';

import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PastDueBanner() {
  const [isPastDue, setIsPastDue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/stripe/subscription', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.stripe_status === 'past_due') setIsPastDue(true);
      })
      .catch(() => {});
  }, []);

  if (!isPastDue) return null;

  const openPortal = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800">
            <strong>Paiement en retard</strong> &mdash; Mettez à jour votre moyen de paiement pour conserver l&apos;accès Pro.
          </span>
        </div>
        <button
          onClick={openPortal}
          disabled={loading}
          className="flex items-center gap-1 text-sm font-semibold text-red-700 hover:text-red-900 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {loading ? 'Chargement...' : 'Mettre à jour'}
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-2">Impossible d&apos;ouvrir le portail. Réessayez ou contactez le support.</p>
      )}
    </div>
  );
}
