'use client';

import AiSummaryCard from './AiSummaryCard';
import SelectionCriteriaWeights from './SelectionCriteriaWeights';
import VigilanceAlerts from './VigilanceAlerts';
import ComplianceChecklist from './ComplianceChecklist';
import type { SelectionCriteria, VigilancePoint } from '@/lib/dev';

interface TabEssentielProps {
  aiSummary: string;
  selectionCriteria: SelectionCriteria[];
  vigilancePoints: VigilancePoint[];
  complianceChecklist: string[];
}

export default function TabEssentiel({
  aiSummary, selectionCriteria, vigilancePoints, complianceChecklist,
}: TabEssentielProps) {
  return (
    <div className="space-y-6">
      <AiSummaryCard summary={aiSummary} />
      <SelectionCriteriaWeights criteria={selectionCriteria} />
      <VigilanceAlerts points={vigilancePoints} />
      <ComplianceChecklist items={complianceChecklist} />
    </div>
  );
}
