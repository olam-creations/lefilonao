'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ExternalLink, RotateCcw } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-slate-100 text-slate-700' },
  pro: { label: 'Pro', color: 'bg-indigo-100 text-indigo-700' },
  enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
};

interface Props {
  plan: string;
  createdAt: string | null;
  stripeStatus: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  onStatusChange?: () => void;
}

export default function SubscriptionCard({
  plan,
  createdAt,
  stripeStatus,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  stripeCustomerId,
  onStatusChange,
}: Props) {
  const current = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openPortal = async () => {
    setPortalLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setActionError(data.error || 'Impossible d\'ouvrir le portail Stripe');
      }
    } catch {
      setActionError('Erreur de connexion. Réessayez.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setConfirmCancel(false);
        onStatusChange?.();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Erreur lors de l\'annulation');
      }
    } catch {
      setActionError('Erreur de connexion. Réessayez.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleResume = async () => {
    setResumeLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/stripe/resume', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        onStatusChange?.();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Erreur lors de la reprise');
      }
    } catch {
      setActionError('Erreur de connexion. Réessayez.');
    } finally {
      setResumeLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <motion.section variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <CreditCard className="w-5 h-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Abonnement</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">Plan actuel :</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${current.color}`}>
            {current.label}
          </span>
          {stripeStatus === 'past_due' && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Paiement en retard
            </span>
          )}
          {cancelAtPeriodEnd && stripeStatus === 'active' && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Annulation programmée
            </span>
          )}
        </div>

        {createdAt && (
          <p className="text-sm text-slate-500">
            Compte créé le {formatDate(createdAt)}
          </p>
        )}

        {plan === 'pro' && currentPeriodEnd && (
          <p className="text-sm text-slate-500">
            {cancelAtPeriodEnd
              ? `Actif jusqu'au ${formatDate(currentPeriodEnd)}, puis passage en Free`
              : `Prochain renouvellement le ${formatDate(currentPeriodEnd)}`}
          </p>
        )}

        {actionError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {actionError}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {plan === 'pro' && cancelAtPeriodEnd && (
            <button
              onClick={handleResume}
              disabled={resumeLoading}
              className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {resumeLoading ? 'Reprise...' : 'Reprendre l\'abonnement'}
            </button>
          )}

          {plan === 'pro' && !cancelAtPeriodEnd && stripeCustomerId && (
            <>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="btn-secondary text-sm py-2 px-5 inline-flex items-center gap-2 disabled:opacity-50"
              >
                {portalLoading ? 'Chargement...' : 'Gérer le paiement'}
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {!confirmCancel ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="text-sm text-slate-400 hover:text-red-600 transition-colors py-2 px-3"
                >
                  Annuler l&apos;abonnement
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  <span className="text-sm text-red-700">Confirmer l&apos;annulation ?</span>
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
                  >
                    {cancelLoading ? 'Annulation...' : 'Oui, annuler'}
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Non
                  </button>
                </div>
              )}
            </>
          )}

          {plan === 'pro' && stripeStatus === 'past_due' && stripeCustomerId && (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {portalLoading ? 'Chargement...' : 'Mettre à jour le paiement'}
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {plan === 'free' && (
            <a
              href="/pricing"
              className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2"
            >
              Passer à Pro
            </a>
          )}
        </div>
      </div>
    </motion.section>
  );
}
