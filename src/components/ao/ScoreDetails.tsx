'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Shield, TrendingUp, Users, Clock, ChevronDown } from 'lucide-react';
import { expandCollapse } from '@/lib/motion-variants';
import type { ScoreCriteria } from '@/lib/dev';

const ICON_MAP: Record<string, React.ElementType> = {
  Shield, Target, TrendingUp, Users, Clock,
};

function CriteriaBar({ label, score, icon, description }: ScoreCriteria) {
  const Icon = ICON_MAP[icon] || Target;
  const pct = (score / 20) * 100;
  const color = score >= 15 ? 'from-emerald-400 to-emerald-500' :
    score >= 10 ? 'from-amber-400 to-amber-500' : 'from-red-400 to-red-500';

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-slate-100 flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-900 truncate">{label}</div>
          <div className="text-[10px] text-slate-400 truncate">{description}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-bold text-slate-900 flex-shrink-0">{score}<span className="text-[10px] text-slate-400">/20</span></span>
      </div>
    </div>
  );
}

interface ScoreDetailsProps {
  criteria: ScoreCriteria[];
  defaultOpen?: boolean;
}

export default function ScoreDetails({ criteria, defaultOpen = false }: ScoreDetailsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-500" />
          Score détaillé — 5 critères
        </h2>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div {...expandCollapse}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
              {criteria.map((c) => (
                <CriteriaBar key={c.label} {...c} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
