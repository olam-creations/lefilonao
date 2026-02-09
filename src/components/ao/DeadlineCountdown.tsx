'use client';

interface DeadlineCountdownProps {
  daysLeft: number | null;
}

export default function DeadlineCountdown({ daysLeft }: DeadlineCountdownProps) {
  if (daysLeft === null) return null;

  const color = daysLeft > 14
    ? { ring: 'text-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' }
    : daysLeft > 7
      ? { ring: 'text-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' }
      : { ring: 'text-red-500', text: 'text-red-700', bg: 'bg-red-50' };

  const pct = Math.max(0, Math.min(100, (daysLeft / 30) * 100));
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className={`flex flex-col items-center gap-1 p-4 rounded-xl ${color.bg}`}>
      <svg width="72" height="72" viewBox="0 0 72 72" className="relative">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          className={color.ring}
          stroke="currentColor" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="36" y="33" textAnchor="middle" className={`text-xl font-bold ${color.text}`} fill="currentColor">
          J-{daysLeft}
        </text>
        <text x="36" y="46" textAnchor="middle" className="text-[9px] text-slate-400" fill="currentColor">
          jours
        </text>
      </svg>
    </div>
  );
}
