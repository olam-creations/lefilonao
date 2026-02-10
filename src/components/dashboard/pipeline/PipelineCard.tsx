'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Building2, Clock, TrendingUp, MoreVertical, GripVertical } from 'lucide-react';
import { formatDate, daysUntil } from '@/lib/ao-utils';

interface PipelineCardProps {
  id: string;
  title: string;
  issuer: string;
  budget?: string;
  deadline: string | null;
  score?: number;
  scoreLabel?: 'GO' | 'MAYBE' | 'PASS';
  tags?: string[];
}

export default function PipelineCard({ 
  id, title, issuer, budget, deadline, score, scoreLabel, tags = [] 
}: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const daysLeft = daysUntil(deadline);
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all ${
        isDragging ? 'shadow-2xl ring-2 ring-indigo-500/20' : ''
      }`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute right-2 top-2 p-1.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-all"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        {scoreLabel && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            scoreLabel === 'GO' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
            scoreLabel === 'MAYBE' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
            'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {scoreLabel} {score}
          </span>
        )}
        {isUrgent && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 animate-pulse">
            J-{daysLeft}
          </span>
        )}
      </div>

      <h4 className="text-sm font-bold text-slate-900 leading-snug mb-3 line-clamp-2 pr-6">
        {title}
      </h4>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{issuer}</span>
        </div>
        
        {budget && (
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            {budget}
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {formatDate(deadline)}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {tags.map((tag) => (
            <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
