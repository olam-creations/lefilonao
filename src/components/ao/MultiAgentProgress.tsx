'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Globe, Brain, PenTool, CheckCheck, CheckCircle2, X, Loader2, AlertCircle } from 'lucide-react';
import type { AgentName } from '@/lib/agents/types';
import type { WrittenSection, ReviewResult } from '@/lib/agents/types';

type AgentStatus = 'pending' | 'running' | 'done' | 'error';
type PipelineState = 'idle' | 'running' | 'done' | 'error';

interface AgentState {
  status: AgentStatus;
  durationMs?: number;
  error?: string;
}

interface MultiAgentProgressProps {
  agents: Record<AgentName, AgentState>;
  progress: number;
  sectionStreams: Map<string, string>;
  sections: Map<string, WrittenSection>;
  review: ReviewResult | null;
  totalMs: number;
  error: string | null;
  pipeline: PipelineState;
  onAbort: () => void;
  onDismiss: () => void;
}

const AGENT_META: { name: AgentName; label: string; icon: typeof FileSearch }[] = [
  { name: 'parser', label: 'Parser DCE', icon: FileSearch },
  { name: 'intelligence', label: 'Veille marche', icon: Globe },
  { name: 'analyst', label: 'Analyse strategique', icon: Brain },
  { name: 'writer', label: 'Redaction', icon: PenTool },
  { name: 'reviewer', label: 'Relecture', icon: CheckCheck },
];

function StatusBadge({ status }: { status: AgentStatus }) {
  const styles: Record<AgentStatus, string> = {
    pending: 'bg-slate-100 text-slate-400',
    running: 'bg-indigo-100 text-indigo-600 animate-pulse',
    done: 'bg-emerald-100 text-emerald-600',
    error: 'bg-red-100 text-red-600',
  };
  const labels: Record<AgentStatus, string> = {
    pending: 'En attente',
    running: 'En cours...',
    done: 'Termine',
    error: 'Erreur',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${styles[status]}`}>
      {status === 'running' && <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />}
      {labels[status]}
    </span>
  );
}

function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export default function MultiAgentProgress({
  agents,
  progress,
  sectionStreams,
  totalMs,
  error,
  pipeline,
  onAbort,
  onDismiss,
}: MultiAgentProgressProps) {
  if (pipeline === 'idle') return null;

  const isDone = pipeline === 'done';
  const isError = pipeline === 'error';

  // Get latest streaming text for live preview
  const streamEntries = Array.from(sectionStreams.entries());
  const latestStream = streamEntries.length > 0 ? streamEntries[streamEntries.length - 1] : null;
  const previewText = latestStream ? latestStream[1].slice(-200) : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl"
      >
        <button
          onClick={onDismiss}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-lg mx-4"
        >
          <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-8">
            <h3 className="text-lg font-bold text-white text-center mb-6">
              {isDone ? 'Analyse complete terminee' : isError ? 'Erreur dans le pipeline' : 'Analyse complete en cours'}
            </h3>

            {/* Global progress bar */}
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-6">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Agent stepper */}
            <div className="space-y-3 mb-6">
              {AGENT_META.map(({ name, label, icon: Icon }, i) => {
                const agent = agents[name];
                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      agent.status === 'done' ? 'bg-emerald-500/20' :
                      agent.status === 'running' ? 'bg-indigo-500/20' :
                      agent.status === 'error' ? 'bg-red-500/20' :
                      'bg-white/5'
                    }`}>
                      {agent.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Icon className={`w-4 h-4 ${
                          agent.status === 'running' ? 'text-indigo-400' :
                          agent.status === 'error' ? 'text-red-400' :
                          'text-white/30'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${
                        agent.status === 'done' ? 'text-emerald-300' :
                        agent.status === 'running' ? 'text-white' :
                        agent.status === 'error' ? 'text-red-300' :
                        'text-white/40'
                      }`}>{label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {agent.durationMs !== undefined && (
                        <span className="text-[10px] text-white/40">{formatDuration(agent.durationMs)}</span>
                      )}
                      <StatusBadge status={agent.status} />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Live preview */}
            {previewText && !isDone && !isError && (
              <div className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-white/30 mb-1">Apercu en direct</p>
                <p className="text-xs text-white/60 line-clamp-3 font-mono">{previewText}</p>
              </div>
            )}

            {/* Error display */}
            {isError && error && (
              <div className="mb-6 flex items-start gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              {isDone && (
                <>
                  {totalMs > 0 && (
                    <span className="text-xs text-white/40">{formatDuration(totalMs)} au total</span>
                  )}
                  <button
                    onClick={onDismiss}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-sm rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all"
                  >
                    Voir les resultats
                  </button>
                </>
              )}

              {isError && (
                <button
                  onClick={onDismiss}
                  className="px-6 py-2.5 bg-white/10 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-all"
                >
                  Fermer
                </button>
              )}

              {pipeline === 'running' && (
                <button
                  onClick={onAbort}
                  className="px-5 py-2 border border-red-400/40 text-red-300 font-semibold text-sm rounded-xl hover:bg-red-500/10 transition-all"
                >
                  Arreter
                </button>
              )}
            </div>

            <p className="text-[10px] text-white/30 text-center mt-4">
              Analyse generee par IA &mdash; verifiez les resultats
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
