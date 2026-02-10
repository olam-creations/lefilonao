/** Escape PostgreSQL LIKE/ILIKE wildcards in user input. */
export function sanitizeSearch(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}
