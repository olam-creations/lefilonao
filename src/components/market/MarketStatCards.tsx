'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Building2, Users } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/motion-variants';
import type { MarketInsight } from './types';
import { formatAmount } from './utils';

function useCountUp(target: number, duration = 600): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setCurrent(target); return; }

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

interface StatItemProps {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
  accent: string;
  format?: (n: number) => string;
}

function StatItem({ label, value, suffix, icon, accent, format }: StatItemProps) {
  const display = useCountUp(value);
  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent}`} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</span>
        <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-slate-900">{format ? format(display) : display.toLocaleString('fr-FR')}</div>
      <div className="text-slate-400 text-sm mt-1">{suffix}</div>
    </motion.div>
  );
}

export default function MarketStatCards({ insights }: { insights: MarketInsight }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatItem label="Marchés attribués" value={insights.totalContracts} suffix="contrats" icon={<BarChart3 className="w-4 h-4" />} accent="from-slate-300 to-slate-400" />
      <StatItem label="Volume total" value={insights.totalValue} suffix="cumulé" icon={<TrendingUp className="w-4 h-4" />} accent="from-emerald-400 to-emerald-500" format={formatAmount} />
      <StatItem label="Valeur moyenne" value={insights.avgValue} suffix="par marché" icon={<Building2 className="w-4 h-4" />} accent="from-indigo-400 to-violet-500" format={formatAmount} />
      <StatItem label="Acheteurs actifs" value={insights.topBuyers.length} suffix="organismes" icon={<Users className="w-4 h-4" />} accent="from-violet-400 to-purple-500" />
    </motion.div>
  );
}
