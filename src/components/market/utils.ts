// ─── Market Utilities ───

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
