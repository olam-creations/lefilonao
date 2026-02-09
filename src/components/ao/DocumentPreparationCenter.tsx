'use client';

import { motion } from 'framer-motion';
import { FolderCheck, AlertCircle } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { RequiredDocumentDetailed } from '@/lib/dev';

interface DocumentPreparationCenterProps {
  documents: RequiredDocumentDetailed[];
  ready: Record<string, boolean>;
  onToggle: (docName: string) => void;
}

export default function DocumentPreparationCenter({ documents, ready, onToggle }: DocumentPreparationCenterProps) {
  const readyCount = Object.values(ready).filter(Boolean).length;
  const total = documents.length;
  const pct = total > 0 ? (readyCount / total) * 100 : 0;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <FolderCheck className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Documents à préparer</h2>
            <p className="text-xs text-slate-400">{readyCount}/{total} documents prêts</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {documents.map((doc) => {
          const isReady = !!ready[doc.name];
          const showWarning = doc.isCritical && !isReady;

          return (
            <div
              key={doc.name}
              className={`flex items-center gap-4 p-4 transition-colors ${showWarning ? 'bg-red-50/30' : ''}`}
            >
              <button
                onClick={() => onToggle(doc.name)}
                className={`w-10 h-6 rounded-full flex-shrink-0 relative transition-colors duration-200 ${
                  isReady ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    isReady ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isReady ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {doc.name}
                  </span>
                  {showWarning && <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{doc.hint}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
