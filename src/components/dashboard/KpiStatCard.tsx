'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion-variants';

interface KpiStatCardProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  accent?: 'emerald' | 'indigo' | 'red' | 'violet';
  children?: React.ReactNode;
}

const accentGradients: Record<string, string> = {
  emerald: 'from-emerald-400 to-emerald-500',
  indigo: 'from-indigo-400 to-violet-500',
  red: 'from-red-400 to-red-500',
  violet: 'from-violet-400 to-purple-500',
};

const accentText: Record<string, string> = {
  emerald: 'text-emerald-600',
  indigo: 'text-indigo-600',
  red: 'text-red-600',
  violet: 'text-violet-600',
};

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

export default function KpiStatCard({ label, value, sub, icon, accent = 'indigo', children }: KpiStatCardProps) {
  const displayValue = useCountUp(value);
  const gradient = accentGradients[accent] ?? accentGradients.indigo;
  const textColor = accentText[accent] ?? accentText.indigo;

  return (
    <motion.div
      variants={fadeUp}
      className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</span>
        <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</div>
      </div>
      <div className={`text-3xl font-bold ${textColor}`}>{displayValue}</div>
      <div className="text-slate-400 text-sm mt-1">{sub}</div>
      {children && <div className="mt-3">{children}</div>}
    </motion.div>
  );
}
