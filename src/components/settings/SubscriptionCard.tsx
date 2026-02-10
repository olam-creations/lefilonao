'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ExternalLink } from 'lucide-react';
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
}

export default function SubscriptionCard({
  plan,
  createdAt,
  stripeStatus,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  stripeCustomerId,
}: Props) {
  const current = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      }
    } finally {
      setPortalLoading(false);
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
        </div>

        {createdAt && (
          <p className="text-sm text-slate-500">
            Compte créé le {formatDate(createdAt)}
          </p>
        )}

        {plan === 'pro' && currentPeriodEnd && (
          <p className="text-sm text-slate-500">
            {cancelAtPeriodEnd
              ? `Actif jusqu'au ${formatDate(currentPeriodEnd)}`
              : `Prochain renouvellement le ${formatDate(currentPeriodEnd)}`}
          </p>
        )}

        {plan === 'pro' && stripeCustomerId ? (
          <div className="pt-2">
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="btn-secondary text-sm py-2 px-5 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {portalLoading ? 'Chargement...' : 'Gérer mon abonnement'}
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : plan === 'free' ? (
          <div className="pt-2">
            <a
              href="/pricing"
              className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2"
            >
              Passer à Pro
            </a>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
