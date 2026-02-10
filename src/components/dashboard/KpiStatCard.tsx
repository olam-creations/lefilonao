'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion-variants';

interface KpiStatCardProps {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  accent?: 'emerald' | 'indigo' | 'red' | 'violet';
  children?: React.ReactNode;
  className?: string;
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

function useCountUp(target: number | string, duration = 600): number | string {
  const [current, setCurrent] = useState<number | string>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof target === 'string') {
      setCurrent(target);
      return;
    }
    
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

export default function KpiStatCard({ label, value, sub, icon, accent = 'indigo', children, className }: KpiStatCardProps) {
  const displayValue = useCountUp(value);
  const gradient = accentGradients[accent] ?? accentGradients.indigo;
  const textColor = accentText[accent] ?? accentText.indigo;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      variants={fadeUp}
      className={`bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden spotlight-card flex flex-col justify-between ${className}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-20 group-hover:opacity-100 transition-opacity`} />
      
      <div>
        <div className="flex items-start justify-between mb-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{label}</span>
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all duration-300">
            {icon}
          </div>
        </div>
        <div className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${textColor}`}>{displayValue}</div>
        <div className="text-slate-400 text-[10px] sm:text-xs mt-1 font-medium line-clamp-1">{sub}</div>
      </div>

      {children && <div className="mt-4 pt-4 border-t border-slate-50">{children}</div>}
    </motion.div>
  );
}
