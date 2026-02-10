import { getSupabase } from '@/lib/supabase';
import { chunkText, type Chunk } from '@/lib/chunker';
import { createEmbedding, createEmbeddings } from '@/lib/embeddings';
import { hasNvidiaKey, nvidiaGenerate } from '@/lib/ai-client';

// ─── Types ───

export interface IndexParams {
  noticeId: string;
  userEmail: string;
  text: string;
  summary?: string;
}

export interface RetrieveParams {
  noticeId: string;
  userEmail: string;
  query: string;
  topK?: number;
  threshold?: number;
}

interface RetrievedChunk {
  content: string;
  summary: string | null;
  similarity: number;
  chunkIndex: number;
  metadata: Record<string, unknown>;
}

export interface RelevantContext {
  context: string;
  strategy: 'rag' | 'fallback';
  chunkCount: number;
}

// ─── Index ───

/**
 * Check if a document has already been indexed.
 */
export async function isDocumentIndexed(noticeId: string, userEmail: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('dce_documents')
    .select('id')
    .eq('notice_id', noticeId)
    .eq('user_email', userEmail)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * Index a DCE document: chunk → summarize → embed → store in pgvector.
 * Idempotent: skips if already indexed.
 */
export async function indexDCEDocument(params: IndexParams): Promise<{ indexed: boolean; chunkCount: number }> {
  const { noticeId, userEmail, text, summary } = params;

  if (await isDocumentIndexed(noticeId, userEmail)) {
    return { indexed: false, chunkCount: 0 };
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) return { indexed: false, chunkCount: 0 };

  // SAC: prefix each chunk with document summary for better embedding context
  const textsToEmbed = chunks.map((c) =>
    summary ? `${summary}\n\n${c.content}` : c.content,
  );

  const embeddings = await createEmbeddings(textsToEmbed, 'RETRIEVAL_DOCUMENT');

  const supabase = getSupabase();

  // Insert chunks with embeddings
  const chunkRows = chunks.map((c, i) => ({
    notice_id: noticeId,
    user_email: userEmail,
    chunk_index: c.index,
    content: c.content,
    summary: summary ?? null,
    embedding: `[${embeddings[i].join(',')}]`,
    metadata: c.metadata,
  }));

  // Batch insert (Supabase handles up to 1000 rows)
  const batchSize = 500;
  for (let i = 0; i < chunkRows.length; i += batchSize) {
    const batch = chunkRows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('dce_chunks')
      .upsert(batch, { onConflict: 'notice_id,user_email,chunk_index' });
    if (error) throw new Error(`Failed to insert chunks: ${error.message}`);
  }

  // Insert document metadata
  await supabase
    .from('dce_documents')
    .upsert({
      notice_id: noticeId,
      user_email: userEmail,
      full_summary: summary ?? null,
      chunk_count: chunks.length,
      total_chars: text.length,
    }, { onConflict: 'notice_id,user_email' });

  return { indexed: true, chunkCount: chunks.length };
}

// ─── Retrieve ───

/**
 * Retrieve relevant chunks using pgvector similarity search.
 */
export async function retrieveChunks(params: RetrieveParams): Promise<RetrievedChunk[]> {
  const { noticeId, userEmail, query, topK = 5, threshold = 0.3 } = params;

  const queryEmbedding = await createEmbedding(query, 'RETRIEVAL_QUERY');

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('match_dce_chunks', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_notice_id: noticeId,
    match_user_email: userEmail,
    match_count: topK,
    match_threshold: threshold,
  });

  if (error) throw new Error(`Chunk retrieval failed: ${error.message}`);

  return (data ?? []).map((row: {
    content: string;
    summary: string | null;
    similarity: number;
    chunk_index: number;
    metadata: Record<string, unknown>;
  }) => ({
    content: row.content,
    summary: row.summary,
    similarity: row.similarity,
    chunkIndex: row.chunk_index,
    metadata: row.metadata ?? {},
  }));
}

// ─── CRAG (Corrective RAG) ───

const RELEVANCE_PROMPT = `Score the relevance of the following text chunk to the query on a scale of 0.0 to 1.0.
Return ONLY a number (e.g., 0.85). No explanation.

Query: {QUERY}

Chunk:
{CHUNK}

Score:`;

/**
 * Evaluate chunk relevance using a cheap LLM call (NVIDIA free tier).
 * Returns filtered chunks above relevance threshold.
 */
async function evaluateRelevance(
  chunks: RetrievedChunk[],
  query: string,
  minScore: number = 0.5,
): Promise<RetrievedChunk[]> {
  if (!hasNvidiaKey() || chunks.length === 0) return chunks;

  const scored = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const prompt = RELEVANCE_PROMPT
          .replace('{QUERY}', query)
          .replace('{CHUNK}', chunk.content.slice(0, 2000));
        const raw = await nvidiaGenerate(prompt);
        const score = parseFloat(raw.trim());
        return { chunk, score: isNaN(score) ? 1.0 : score };
      } catch {
        return { chunk, score: 1.0 }; // Keep chunk on evaluation failure
      }
    }),
  );

  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.chunk);
}

// ─── Convenience ───

/**
 * Get relevant context for a query against an indexed DCE document.
 * Falls back to full text (truncated) if RAG retrieval yields too few results.
 */
export async function getRelevantContext(params: {
  noticeId: string;
  userEmail: string;
  query: string;
  fullText: string;
  topK?: number;
}): Promise<RelevantContext> {
  const { noticeId, userEmail, query, fullText, topK = 8 } = params;

  try {
    // Check if document is indexed
    const indexed = await isDocumentIndexed(noticeId, userEmail);
    if (!indexed) {
      return {
        context: fullText.slice(0, 15000),
        strategy: 'fallback',
        chunkCount: 0,
      };
    }

    // Retrieve similar chunks
    const rawChunks = await retrieveChunks({
      noticeId,
      userEmail,
      query,
      topK,
      threshold: 0.25,
    });

    // CRAG: evaluate and filter
    const relevantChunks = await evaluateRelevance(rawChunks, query);

    // If too few relevant chunks, fallback to full context
    if (relevantChunks.length < 2) {
      return {
        context: fullText.slice(0, 15000),
        strategy: 'fallback',
        chunkCount: relevantChunks.length,
      };
    }

    // Build context from relevant chunks, ordered by chunk index
    const orderedChunks = [...relevantChunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
    const context = orderedChunks
      .map((c) => c.content)
      .join('\n\n---\n\n');

    return {
      context,
      strategy: 'rag',
      chunkCount: relevantChunks.length,
    };
  } catch {
    // Any RAG failure → graceful fallback
    return {
      context: fullText.slice(0, 15000),
      strategy: 'fallback',
      chunkCount: 0,
    };
  }
}
