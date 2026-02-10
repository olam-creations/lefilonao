'use client';

import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-slate-100 text-slate-700' },
  pro: { label: 'Pro', color: 'bg-indigo-100 text-indigo-700' },
  enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
};

interface Props {
  plan: string;
  createdAt: string | null;
}

export default function SubscriptionCard({ plan, createdAt }: Props) {
  const current = PLAN_LABELS[plan] ?? PLAN_LABELS.free;

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
        </div>

        {createdAt && (
          <p className="text-sm text-slate-500">
            Compte créé le{' '}
            {new Date(createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}

        {plan === 'free' && (
          <div className="pt-2">
            <a
              href="/pricing"
              className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2"
            >
              Passer à Pro
            </a>
          </div>
        )}
      </div>
    </motion.section>
  );
}
