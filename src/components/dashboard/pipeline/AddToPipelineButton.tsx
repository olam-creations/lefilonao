'use client';

import { useState, useCallback } from 'react';
import { Kanban, Check, Loader2, Plus } from 'lucide-react';
import { getTokenPayload } from '@/lib/auth';
import type { RFP } from '@/hooks/useDashboardFilters';

interface AddToPipelineButtonProps {
  rfp: RFP;
  className?: string;
  variant?: 'compact' | 'full';
}

export default function AddToPipelineButton({ rfp, className, variant = 'full' }: AddToPipelineButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const email = getTokenPayload()?.email;
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: email,
          ao_id: rfp.id,
          ao_title: rfp.title,
          ao_issuer: rfp.issuer,
          ao_budget: rfp.budget,
          ao_deadline: rfp.deadline,
          ao_score: rfp.score,
          ao_score_label: rfp.scoreLabel,
        }),
      });

      if (res.ok) {
        setAdded(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [rfp]);

  if (added) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 ${className}`}>
        <Check className="w-3.5 h-3.5" />
        {variant === 'full' && "Dans le pipeline"}
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
        loading 
          ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-wait' 
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 shadow-sm'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Kanban className="w-3.5 h-3.5" />
      )}
      {variant === 'full' && (loading ? "Ajout..." : "Gérer dans CRM")}
    </button>
  );
}
