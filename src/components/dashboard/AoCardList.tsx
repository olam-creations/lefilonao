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
}

const TOTAL_DOCUMENTS = 8;
const TOTAL_SECTIONS = 7;

export default function AoCardList({ rfps, workspaces, onExplore }: AoCardListProps) {
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
            totalDocuments={TOTAL_DOCUMENTS}
            totalSections={TOTAL_SECTIONS}
            onExplore={onExplore}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
