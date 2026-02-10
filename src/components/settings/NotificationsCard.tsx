'use client';

import { motion } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';

const FREQUENCIES = [
  { value: 'instant', label: 'Instantané', desc: 'Recevez un email pour chaque nouvel AO' },
  { value: 'daily', label: 'Quotidien', desc: 'Un digest chaque matin à 8h', recommended: true },
  { value: 'weekly', label: 'Hebdomadaire', desc: 'Un résumé chaque lundi matin' },
] as const;

interface Props {
  notifyFrequency: string;
  notifyEmail: boolean;
  onUpdate: (partial: { notify_frequency?: string; notify_email?: boolean }) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  saved: boolean;
}

export default function NotificationsCard({
  notifyFrequency,
  notifyEmail,
  onUpdate,
  onSave,
  saving,
  saved,
}: Props) {
  return (
    <motion.section variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <Bell className="w-5 h-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Configurez quand et comment recevoir vos alertes
      </p>

      <div className="space-y-3 mb-6">
        {FREQUENCIES.map((freq) => (
          <button
            key={freq.value}
            type="button"
            onClick={() => onUpdate({ notify_frequency: freq.value })}
            disabled={!notifyEmail}
            className={`radio-card w-full text-left ${notifyFrequency === freq.value ? 'selected' : ''} ${!notifyEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="radio-dot" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{freq.label}</span>
                {'recommended' in freq && freq.recommended && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                    Recommandé
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{freq.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 mb-6">
        <div>
          <p className="text-sm font-medium text-slate-900">Notifications par email</p>
          <p className="text-xs text-slate-500">Désactivez pour couper toutes les notifications</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={notifyEmail}
          onClick={() => onUpdate({ notify_email: !notifyEmail })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifyEmail ? 'bg-indigo-600' : 'bg-slate-300'}`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${notifyEmail ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
      >
        {saving ? 'Sauvegarde...' : saved ? (
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            Sauvegardé
          </span>
        ) : 'Sauvegarder'}
      </button>
    </motion.section>
  );
}
