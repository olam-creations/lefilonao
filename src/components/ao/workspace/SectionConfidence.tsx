'use client';

interface SectionConfidenceProps {
  wordCount: number;
  targetWords?: number;
  hasReferences: boolean;
  hasNumbers: boolean;
  buyerExpectationMatch: boolean;
  isReviewed: boolean;
}

export function computeConfidence({
  wordCount,
  targetWords = 200,
  hasReferences,
  hasNumbers,
  buyerExpectationMatch,
  isReviewed,
}: SectionConfidenceProps): number {
  let score = 0;
  if (wordCount >= targetWords * 0.8) score += 1;
  if (hasReferences) score += 1;
  if (hasNumbers) score += 1;
  if (buyerExpectationMatch) score += 1;
  if (isReviewed) score += 1;
  return score;
}

export function confidenceColor(score: number): string {
  if (score >= 4) return 'text-emerald-500';
  if (score >= 3) return 'text-amber-500';
  return 'text-red-400';
}

export function confidenceBg(score: number): string {
  if (score >= 4) return 'bg-emerald-500';
  if (score >= 3) return 'bg-amber-400';
  return 'bg-red-400';
}

export default function SectionConfidence(props: SectionConfidenceProps) {
  const score = computeConfidence(props);
  const color = confidenceColor(score);

  return (
    <div className="flex items-center gap-0.5" title={`Confiance: ${score}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < score ? confidenceBg(score) : 'bg-slate-200'}`}
        />
      ))}
      <span className={`text-[10px] font-semibold ml-1 ${color}`}>{score}/5</span>
    </div>
  );
}
