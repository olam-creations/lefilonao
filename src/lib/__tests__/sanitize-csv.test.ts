import { describe, it, expect } from 'vitest';

// Extract the function here for testing (it's private in page.tsx)
function sanitizeCsvCell(value: string): string {
  const needsPrefix = /^[=+\-@\t\r|]/.test(value);
  const escaped = value.replace(/"/g, '""');
  if (needsPrefix) return `'${escaped}`;
  return escaped;
}

describe('sanitizeCsvCell', () => {
  it('returns plain text unchanged', () => {
    expect(sanitizeCsvCell('Hello World')).toBe('Hello World');
  });

  it('escapes double quotes', () => {
    expect(sanitizeCsvCell('Say "hello"')).toBe('Say ""hello""');
  });

  it('prefixes = to prevent formula injection', () => {
    expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
  });

  it('prefixes + to prevent formula injection', () => {
    expect(sanitizeCsvCell('+cmd|calc')).toBe("'+cmd|calc");
  });

  it('prefixes - to prevent formula injection', () => {
    expect(sanitizeCsvCell('-1+2')).toBe("'-1+2");
  });

  it('prefixes @ to prevent formula injection', () => {
    expect(sanitizeCsvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('prefixes | to prevent LibreOffice formula injection', () => {
    expect(sanitizeCsvCell('|cmd')).toBe("'|cmd");
  });

  it('prefixes tab character', () => {
    expect(sanitizeCsvCell('\t=cmd')).toBe("'\t=cmd");
  });

  it('prefixes carriage return', () => {
    expect(sanitizeCsvCell('\r=cmd')).toBe("'\r=cmd");
  });

  it('handles combined: dangerous prefix + quotes', () => {
    expect(sanitizeCsvCell('=cmd|"calc"')).toBe(`'=cmd|""calc""`);
  });

  it('does not prefix safe strings starting with numbers', () => {
    expect(sanitizeCsvCell('123 ABC')).toBe('123 ABC');
  });

  it('handles empty string', () => {
    expect(sanitizeCsvCell('')).toBe('');
  });
});
