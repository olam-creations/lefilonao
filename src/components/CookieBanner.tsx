'use client';

import { useState, useEffect, useCallback } from 'react';

const CONSENT_KEY = 'lefilonao_consent';

interface ConsentState {
  essential: boolean;
  analytics: boolean;
  errorTracking: boolean;
  timestamp: string;
}

function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

function saveConsent(consent: ConsentState): void {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent('consent-updated', { detail: consent }));
}

export function getConsent(): ConsentState | null {
  return getStoredConsent();
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [errorTracking, setErrorTracking] = useState(true);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    }

    const handleOpen = () => {
      setVisible(true);
      setShowDetails(false);
    };
    window.addEventListener('open-cookie-banner', handleOpen);
    return () => window.removeEventListener('open-cookie-banner', handleOpen);
  }, []);

  const handleAcceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      errorTracking: true,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
  }, []);

  const handleRefuseAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: false,
      errorTracking: false,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
  }, []);

  const handleSaveCustom = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      errorTracking,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
  }, [errorTracking]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6" role="dialog" aria-label="Gestion des cookies">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200 p-6">
        {!showDetails ? (
          <>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Nous utilisons des cookies essentiels pour le fonctionnement du site et, avec votre consentement,
              des cookies de suivi d&apos;erreurs (Sentry) pour am&eacute;liorer votre exp&eacute;rience.
              Nos analytiques (Plausible) fonctionnent sans cookies.{' '}
              <a href="/politique-confidentialite#cookies" className="text-indigo-600 hover:text-indigo-700 underline">
                En savoir plus
              </a>
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Tout accepter
              </button>
              <button
                onClick={handleRefuseAll}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Tout refuser
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Personnaliser
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-sm font-bold text-slate-900 mb-4">Param&eacute;trer les cookies</h3>
            <div className="space-y-3 mb-5">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-900">Essentiels</p>
                  <p className="text-xs text-slate-400">Authentification, pr&eacute;f&eacute;rences. Toujours actifs.</p>
                </div>
                <input type="checkbox" checked disabled className="w-4 h-4 accent-indigo-600" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-900">Analytiques (Plausible)</p>
                  <p className="text-xs text-slate-400">Sans cookies &mdash; exempt&eacute; de consentement (CNIL).</p>
                </div>
                <input type="checkbox" checked disabled className="w-4 h-4 accent-indigo-600" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-slate-900">Suivi d&apos;erreurs (Sentry)</p>
                  <p className="text-xs text-slate-400">D&eacute;tecte les erreurs pour am&eacute;liorer le service.</p>
                </div>
                <input
                  type="checkbox"
                  checked={errorTracking}
                  onChange={(e) => setErrorTracking(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleSaveCustom}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Enregistrer mes choix
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
