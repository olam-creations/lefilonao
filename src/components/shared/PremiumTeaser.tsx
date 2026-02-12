'use client';

import { useUser } from '@/components/UserProvider';
import { Lock } from 'lucide-react';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PremiumTeaserProps {
  children: ReactNode;
  blur?: string;
  message?: string;
}

/**
 * Teases premium content by blurring it for free users.
 */
export default function PremiumTeaser({ 
  children, 
  blur = 'blur-sm', 
  message = 'Réservé aux membres Pro' 
}: PremiumTeaserProps) {
  const { plan, loading } = useUser();

  if (loading) return <div className="animate-pulse bg-slate-100 rounded h-10 w-full" />;
  
  if (plan === 'pro' || plan === 'admin') {
    return <>{children}</>;
  }

  return (
    <div className="relative group overflow-hidden rounded-lg">
      {/* Blurred Content */}
      <div className={`select-none pointer-events-none ${blur} opacity-40 transition-all`}>
        {children}
      </div>

      {/* Overlay Badge */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px] transition-colors group-hover:bg-white/20">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-full shadow-lg border border-slate-700"
        >
          <Lock className="w-3 h-3 text-indigo-400" />
          <span className="uppercase tracking-wider">{message}</span>
        </motion.div>
      </div>
    </div>
  );
}
