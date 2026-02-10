export interface Chunk {
  index: number;
  content: string;
  metadata: {
    sectionTitle?: string;
    hasTables: boolean;
    charOffset: number;
  };
}

export interface ChunkOptions {
  maxChunkSize?: number;
  overlapSize?: number;
}

const DEFAULT_MAX_CHUNK = 2000;
const DEFAULT_OVERLAP = 200;

const SECTION_TITLE_RE = /^(?:article\s+\d|chapitre\s+\d|\d+[\.\)]\s+[A-Z]|[A-Z][A-Z\s]{4,}$)/m;
const TABLE_INDICATOR_RE = /(?:\|.*\|)|(?:---\s*TABLEAU\s*\d)|(?:---\s*PAGE\s*\d)/;

/**
 * Find the nearest sentence boundary (.!?) before maxPos.
 * Falls back to whitespace boundary, then maxPos itself.
 */
function findSentenceBoundary(text: string, maxPos: number): number {
  if (maxPos >= text.length) return text.length;

  // Look backwards from maxPos for sentence-ending punctuation followed by whitespace
  for (let i = maxPos; i > maxPos - 300 && i > 0; i--) {
    const ch = text[i - 1];
    if ((ch === '.' || ch === '!' || ch === '?') && i < text.length && /\s/.test(text[i])) {
      return i;
    }
  }

  // Fallback: whitespace boundary
  for (let i = maxPos; i > maxPos - 100 && i > 0; i--) {
    if (/\s/.test(text[i])) return i + 1;
  }

  return maxPos;
}

/**
 * Detect section title from the first few lines of a chunk.
 */
function detectSectionTitle(text: string): string | undefined {
  const firstLines = text.slice(0, 200);
  const match = firstLines.match(SECTION_TITLE_RE);
  return match ? match[0].trim() : undefined;
}

/**
 * Chunk text into overlapping segments with sentence-boundary splitting.
 * Detects section titles and table presence for metadata.
 */
export function chunkText(text: string, options?: ChunkOptions): Chunk[] {
  const maxChunkSize = options?.maxChunkSize ?? DEFAULT_MAX_CHUNK;
  const overlapSize = options?.overlapSize ?? DEFAULT_OVERLAP;

  if (!text.trim()) return [];
  if (text.length <= maxChunkSize) {
    return [{
      index: 0,
      content: text,
      metadata: {
        sectionTitle: detectSectionTitle(text),
        hasTables: TABLE_INDICATOR_RE.test(text),
        charOffset: 0,
      },
    }];
  }

  const chunks: Chunk[] = [];
  let pos = 0;
  let index = 0;

  while (pos < text.length) {
    const end = findSentenceBoundary(text, pos + maxChunkSize);
    const content = text.slice(pos, end);

    chunks.push({
      index,
      content,
      metadata: {
        sectionTitle: detectSectionTitle(content),
        hasTables: TABLE_INDICATOR_RE.test(content),
        charOffset: pos,
      },
    });

    // Advance with overlap
    const nextPos = end - overlapSize;
    pos = nextPos <= pos ? end : nextPos;
    index++;
  }

  return chunks;
}
