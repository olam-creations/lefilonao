'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronDown, Search, TrendingUp, Download, Mail, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getOnboarding, dismissOnboarding, type OnboardingState } from '@/lib/auth';

interface OnboardingChecklistProps {
  onRefresh?: () => void;
}

const STEPS = [
  { key: 'profile' as const, label: 'Créer votre profil', icon: UserCircle },
  { key: 'explore' as const, label: 'Explorer un appel d\'offres', icon: Search },
  { key: 'market' as const, label: 'Consulter le marché', icon: TrendingUp },
  { key: 'export' as const, label: 'Exporter vos AO', icon: Download },
  { key: 'alerts' as const, label: 'Affiner vos alertes', icon: Mail },
];

export default function OnboardingChecklist({ onRefresh }: OnboardingChecklistProps) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setState(getOnboarding());
  }, []);

  // Re-read state when parent signals a refresh
  useEffect(() => {
    if (onRefresh) {
      setState(getOnboarding());
    }
  }, [onRefresh]);

  if (!state || state.dismissed) return null;

  const completedCount = STEPS.filter((s) => state.steps[s.key]).length;
  const allDone = completedCount === STEPS.length;

  if (allDone) {
    return (
      <motion.div
        className="onboarding-card mb-6 text-center"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: 2, duration: 0.4 }}
        onAnimationComplete={() => {
          dismissOnboarding();
          setState({ ...state, dismissed: true });
        }}
      >
        <div className="flex items-center justify-center gap-2 text-indigo-700 font-semibold">
          <Check className="w-5 h-5" />
          Bravo, vous avez tout exploré !
        </div>
      </motion.div>
    );
  }

  const handleDismiss = () => {
    dismissOnboarding();
    setState({ ...state, dismissed: true });
  };

  return (
    <div className="onboarding-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-slate-900">Premiers pas avec Le Filon</h3>
          <span className="text-xs font-mono bg-white/80 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-200">
            {completedCount}/{STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Masquer
          </button>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="p-1 rounded hover:bg-white/50 transition-colors"
          >
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-4">
        <div
          className="progress-bar-fill"
          style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
        />
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const done = state.steps[step.key];
                const content = (
                  <>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-200'
                    }`}>
                      {done
                        ? <Check className="w-3.5 h-3.5 text-white" />
                        : <Icon className="w-3 h-3 text-slate-400" />
                      }
                    </div>
                    <span className={`text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {step.label}
                    </span>
                  </>
                );
                const cls = `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  done ? 'bg-white/60' : 'bg-white/40'
                }`;
                return step.key === 'profile' ? (
                  <Link key={step.key} href="/dashboard/profile" className={cls}>
                    {content}
                  </Link>
                ) : (
                  <div key={step.key} className={cls}>
                    {content}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
