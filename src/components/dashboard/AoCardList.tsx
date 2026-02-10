'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { stagger } from '@/lib/motion-variants';
import type { RFP } from '@/hooks/useDashboardFilters';
import type { WorkspaceState } from '@/lib/ao-utils';
import AoCard from './AoCard';

interface AoCardListProps {
  rfps: RFP[];
  workspaces: Record<string, WorkspaceState>;
  onExplore?: () => void;
  totalDocuments?: number;
  totalSections?: number;
}

export default function AoCardList({ 
  rfps, 
  workspaces, 
  onExplore,
  totalDocuments = 8,
  totalSections = 7
}: AoCardListProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      <AnimatePresence mode="popLayout">
        {rfps.map((rfp) => (
          <AoCard
            key={rfp.id}
            rfp={rfp}
            workspace={workspaces[rfp.id] ?? null}
            totalDocuments={totalDocuments}
            totalSections={totalSections}
            onExplore={onExplore}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
