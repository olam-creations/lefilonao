'use client';

import { motion } from 'framer-motion';
import { Brain, RefreshCw, Lightbulb, AlertTriangle, CircleAlert, Loader2 } from 'lucide-react';
import type { CoachResponse } from '@/lib/dev';

interface AiCoachPanelProps {
  coachData: CoachResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-900">{score}%</span>
      </div>
    </div>
  );
}

const SUGGESTION_ICONS = {
  tip: { icon: Lightbulb, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  missing: { icon: CircleAlert, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
} as const;

export default function AiCoachPanel({ coachData, loading, onRefresh }: AiCoachPanelProps) {
  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-indigo-50/80 to-violet-50/80 rounded-2xl border border-indigo-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Coach IA</h3>
              <p className="text-xs text-slate-500">Analyse et suggestions pour votre memoire</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {loading ? 'Analyse...' : coachData ? 'Rafraichir' : 'Analyser'}
          </button>
        </div>

        {coachData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Score + Overall advice */}
            <div className="flex items-start gap-4">
              <ScoreRing score={coachData.completenessScore} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 mb-1">Completude du memoire</p>
                <p className="text-sm text-slate-700 leading-relaxed">{coachData.overallAdvice}</p>
              </div>
            </div>

            {/* Suggestions */}
            {coachData.suggestions.length > 0 && (
              <div className="space-y-2">
                {coachData.suggestions.map((suggestion, i) => {
                  const config = SUGGESTION_ICONS[suggestion.type];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-start gap-2.5 p-3 rounded-xl ${config.bg} border ${config.border}`}
                    >
                      <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-relaxed">{suggestion.message}</p>
                        {suggestion.sectionId && (
                          <button
                            onClick={() => {
                              const el = document.getElementById('memoire-builder');
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1 transition-colors"
                          >
                            Voir la section
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {!coachData && !loading && (
          <p className="text-sm text-slate-400 text-center py-4">
            Cliquez sur &quot;Analyser&quot; pour obtenir des conseils IA personnalises
          </p>
        )}
      </div>
    </div>
  );
}
