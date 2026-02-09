// ─── Market Utilities ───

/** True if the string looks like an unresolved SIRET (9-14 digit number) */
export function isSiret(name: string): boolean {
  return /^\d{9,14}$/.test(name.trim());
}

/** Format a raw SIRET into a readable form: "340 546 993 00668" */
export function formatSiret(raw: string): string {
  const s = raw.trim();
  if (s.length === 14) {
    return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}`;
  }
  return s;
}

export function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M\u20ac`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k\u20ac`;
  return `${amount}\u20ac`;
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function calculatePercentages(values: number[]): number[] {
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total === 0) return values.map(() => 0);
  return values.map((v) => (v / total) * 100);
}

export function generateSvgPath(
  points: { x: number; y: number }[],
  closed: boolean,
): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`;
  }
  if (closed) d += ' Z';
  return d;
}

export function sanitizeCsvCell(value: string): string {
  const needsPrefix = /^[=+\-@\t\r|]/.test(value);
  const escaped = value.replace(/"/g, '""');
  if (needsPrefix) return `'${escaped}`;
  return escaped;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function estimateRenewalDate(notificationDate: string): string {
  const d = new Date(notificationDate);
  d.setFullYear(d.getFullYear() + 4);
  return d.toISOString().slice(0, 10);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function hhiLabel(concentration: 'low' | 'moderate' | 'high'): string {
  const labels = { low: 'Concurrence ouverte', moderate: 'Concentration modérée', high: 'Marché concentré' };
  return labels[concentration];
}

export function hhiColor(concentration: 'low' | 'moderate' | 'high'): { bg: string; text: string } {
  const colors = {
    low: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    moderate: { bg: 'bg-amber-50', text: 'text-amber-700' },
    high: { bg: 'bg-red-50', text: 'text-red-700' },
  };
  return colors[concentration];
}

export const CPV_NAMES: Record<string, string> = {
  '72': 'IT', '48': 'Logiciels', '79': 'Services', '71': 'Ingénierie',
  '80': 'Formation', '64': 'Télécoms', '50': 'Maintenance', '45': 'BTP',
  '34': 'Transport', '33': 'Médical',
};

export function downloadCsv(filename: string, csvContent: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
