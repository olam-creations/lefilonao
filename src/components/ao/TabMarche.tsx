'use client';

import MarketIntelligence from './MarketIntelligence';
import ResponseTimeline from './ResponseTimeline';

interface TabMarcheProps {
  buyerHistory: { title: string; amount: string; date: string; winner: string }[];
  competitors: { name: string; wins: number; avgBudget: string }[];
  publishedAt: string;
  deadline: string;
}

export default function TabMarche({ buyerHistory, competitors, publishedAt, deadline }: TabMarcheProps) {
  return (
    <div className="space-y-6">
      <MarketIntelligence buyerHistory={buyerHistory} competitors={competitors} defaultOpen />
      <ResponseTimeline publishedAt={publishedAt} deadline={deadline} />
    </div>
  );
}
