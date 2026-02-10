'use client';

interface ThreatBadgeProps {
  level: 'high' | 'medium' | 'low';
}

const CONFIG = {
  high: { label: 'ELEVE', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  medium: { label: 'MOYEN', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { label: 'FAIBLE', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export default function ThreatBadge({ level }: ThreatBadgeProps) {
  const c = CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
