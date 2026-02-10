'use client';

interface FinancialHealthBadgeProps {
  score: number | null | undefined;
  hasActiveProcedure?: boolean;
  compact?: boolean;
}

function scoreColor(score: number): { bg: string; text: string; dot: string } {
  if (score >= 70) return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
  if (score >= 40) return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
  return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'Saine';
  if (score >= 40) return 'Moyenne';
  return 'Fragile';
}

export default function FinancialHealthBadge({ score, hasActiveProcedure, compact }: FinancialHealthBadgeProps) {
  if (score == null) return null;

  const colors = scoreColor(score);

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}>
        {hasActiveProcedure && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
        {!hasActiveProcedure && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />}
        {score}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg}`}>
      {hasActiveProcedure ? (
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      ) : (
        <span className={`w-3 h-3 rounded-full ${colors.dot}`} />
      )}
      <div className="flex items-baseline gap-1.5">
        <span className={`text-sm font-bold ${colors.text}`}>{score}/100</span>
        <span className={`text-[10px] ${colors.text} opacity-70`}>{scoreLabel(score)}</span>
      </div>
      {hasActiveProcedure && (
        <span className="text-[10px] font-medium text-red-600 ml-auto">Procedure en cours</span>
      )}
    </div>
  );
}
