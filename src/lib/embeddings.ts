import { bulkhead } from 'cockatiel';

const GEMINI_EMBEDDING_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004';
const EMBEDDING_DIMS = 768;
const MAX_BATCH_SIZE = 100;

const concurrencyLimiter = bulkhead(10);

export interface EmbeddingResult {
  embedding: number[];
}

/**
 * Create embeddings for a single text using Gemini text-embedding-004.
 */
export async function createEmbedding(
  text: string,
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT',
): Promise<number[]> {
  const results = await createEmbeddings([text], taskType);
  return results[0];
}

/**
 * Create embeddings for multiple texts in a single batch request.
 * Uses concurrency limiter to stay under Gemini rate limits.
 */
export async function createEmbeddings(
  texts: string[],
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT',
): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY requis pour les embeddings');

  if (texts.length === 0) return [];

  // Split into batches of MAX_BATCH_SIZE
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    batches.push(texts.slice(i, i + MAX_BATCH_SIZE));
  }

  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    const result = await concurrencyLimiter.execute(async () => {
      const response = await fetch(
        `${GEMINI_EMBEDDING_URL}:batchEmbedContents?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: batch.map((text) => ({
              model: 'models/text-embedding-004',
              content: { parts: [{ text }] },
              taskType,
              outputDimensionality: EMBEDDING_DIMS,
            })),
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Gemini embedding error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as {
        embeddings: { values: number[] }[];
      };

      return data.embeddings.map((e) => e.values);
    });

    allEmbeddings.push(...result);
  }

  return allEmbeddings;
}

export { EMBEDDING_DIMS };
