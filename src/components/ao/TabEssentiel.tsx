'use client';

import AiSummaryCard from './AiSummaryCard';
import SelectionCriteriaWeights from './SelectionCriteriaWeights';
import VigilanceAlerts from './VigilanceAlerts';
import ComplianceChecklist from './ComplianceChecklist';
import PriceBenchmark from '@/components/intel/PriceBenchmark';
import type { SelectionCriteria, VigilancePoint } from '@/lib/dev';

interface TabEssentielProps {
  aiSummary: string;
  selectionCriteria: SelectionCriteria[];
  vigilancePoints: VigilancePoint[];
  complianceChecklist: string[];
  cpv?: string;
  region?: string;
  budget?: number;
}

export default function TabEssentiel({
  aiSummary, selectionCriteria, vigilancePoints, complianceChecklist, cpv, region, budget,
}: TabEssentielProps) {
  return (
    <div className="space-y-6">
      <AiSummaryCard summary={aiSummary} />
      <SelectionCriteriaWeights criteria={selectionCriteria} />
      <VigilanceAlerts points={vigilancePoints} />
      <ComplianceChecklist items={complianceChecklist} />
      {cpv && <PriceBenchmark cpv={cpv} region={region} amount={budget} />}
    </div>
  );
}
