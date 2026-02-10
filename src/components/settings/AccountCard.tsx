'use client';

import { motion } from 'framer-motion';
import { User, LogOut, Check } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';

function formatMemberSince(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const created = new Date(dateStr);
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - created.getFullYear()) * 12 + now.getMonth() - created.getMonth());
  if (months < 1) return 'Membre depuis moins d\u2019un mois';
  if (months === 1) return 'Membre depuis 1 mois';
  return `Membre depuis ${months} mois`;
}

interface Props {
  email: string;
  displayName: string;
  createdAt: string | null;
  onDisplayNameChange: (name: string) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  saved: boolean;
  onLogout: () => void;
}

export default function AccountCard({ email, displayName, createdAt, onDisplayNameChange, onSave, saving, saved, onLogout }: Props) {
  return (
    <motion.section variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <User className="w-5 h-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Mon compte</h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">Gérez votre identité et votre connexion</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
          />
          {createdAt && (
            <p className="text-xs text-slate-400 mt-1">{formatMemberSince(createdAt)}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom affiché</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="Votre nom ou pseudo"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
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
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </motion.section>
  );
}
