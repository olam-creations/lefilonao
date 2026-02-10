'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import PipelineCard from './PipelineCard';

interface PipelineItem {
  id: string;
  ao_title: string;
  ao_issuer: string;
  ao_budget?: string;
  ao_deadline: string | null;
  ao_score?: number;
  ao_score_label?: 'GO' | 'MAYBE' | 'PASS';
  tags?: string[];
}

interface PipelineColumnProps {
  id: string;
  title: string;
  items: PipelineItem[];
  count: number;
}

export default function PipelineColumn({ id, title, items, count }: PipelineColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full min-w-[300px] w-full max-w-[350px]">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{title}</h3>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
            {count}
          </span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-indigo-200 shadow-lg" />
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 bg-slate-100/50 rounded-2xl p-2 border border-slate-200/50 min-h-[500px] transition-colors"
      >
        <SortableContext id={id} items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((item) => (
              <PipelineCard
                key={item.id}
                id={item.id}
                title={item.ao_title}
                issuer={item.ao_issuer}
                budget={item.ao_budget}
                deadline={item.ao_deadline}
                score={item.ao_score}
                scoreLabel={item.ao_score_label}
                tags={item.tags}
              />
            ))}
            
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/50 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-2">
                  <div className="w-4 h-0.5 bg-slate-300 rounded-full" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Glisser un AO ici</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
