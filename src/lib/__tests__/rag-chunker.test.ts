import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chunkText, type Chunk } from '../chunker';
import {
  isDocumentIndexed,
  indexDCEDocument,
  retrieveChunks,
  getRelevantContext,
  type IndexParams,
  type RetrieveParams,
} from '../rag';

// ─── Mock Dependencies ───

// Mock Supabase client
vi.mock('@/lib/supabase', () => {
  const mockSupabaseClient = {
    from: vi.fn(() => mockSupabaseClient),
    select: vi.fn(() => mockSupabaseClient),
    eq: vi.fn(() => mockSupabaseClient),
    limit: vi.fn(() => mockSupabaseClient),
    upsert: vi.fn(() => mockSupabaseClient),
    rpc: vi.fn(() => mockSupabaseClient),
  };

  return {
    getSupabase: vi.fn(() => mockSupabaseClient),
  };
});

// Mock embeddings
vi.mock('@/lib/embeddings', () => ({
  createEmbedding: vi.fn(() => Promise.resolve(new Array(768).fill(0.1))),
  createEmbeddings: vi.fn((texts: string[]) =>
    Promise.resolve(texts.map(() => new Array(768).fill(0.1)))
  ),
  EMBEDDING_DIMS: 768,
}));

// Mock AI client (disable CRAG in tests)
vi.mock('@/lib/ai-client', () => ({
  hasNvidiaKey: vi.fn(() => false),
  nvidiaGenerate: vi.fn(() => Promise.resolve('0.85')),
}));

// ─── Test Suite: chunker.ts ───

describe('chunkText', () => {
  it('returns single chunk for short text (< chunkSize)', () => {
    const text = 'This is a short text that fits in one chunk.';
    const result = chunkText(text, { maxChunkSize: 100 });

    expect(result).toHaveLength(1);
    expect(result[0].index).toBe(0);
    expect(result[0].content).toBe(text);
    expect(result[0].metadata.charOffset).toBe(0);
  });

  it('returns empty array for empty text', () => {
    const result = chunkText('');
    expect(result).toEqual([]);

    const resultWhitespace = chunkText('   \n\t  ');
    expect(resultWhitespace).toEqual([]);
  });

  it('splits long text into multiple chunks with overlap', () => {
    const text = 'A'.repeat(1000) + '. ' + 'B'.repeat(1000) + '. ' + 'C'.repeat(1000) + '.';
    const result = chunkText(text, { maxChunkSize: 1000, overlapSize: 100 });

    expect(result.length).toBeGreaterThan(1);

    // Verify sequential indexing
    result.forEach((chunk, i) => {
      expect(chunk.index).toBe(i);
    });

    // Verify overlap: end of chunk N should appear in start of chunk N+1
    if (result.length > 1) {
      const chunk0End = result[0].content.slice(-50);
      const chunk1Start = result[1].content.slice(0, 150);
      expect(chunk1Start).toContain(chunk0End.slice(0, 20));
    }
  });

  it('respects sentence boundaries (split at . ! ?)', () => {
    const text = 'First sentence. Second sentence! Third sentence? Fourth sentence.';
    const result = chunkText(text, { maxChunkSize: 40, overlapSize: 10 });

    // Each chunk should ideally end at a sentence boundary
    result.forEach((chunk) => {
      const trimmed = chunk.content.trim();
      if (trimmed.length > 0) {
        // Check if ends with sentence punctuation or is the last chunk
        const lastChar = trimmed[trimmed.length - 1];
        const validEnding = ['.', '!', '?'].includes(lastChar) || result.indexOf(chunk) === result.length - 1;
        expect(validEnding).toBe(true);
      }
    });
  });

  it('detects section titles in metadata', () => {
    const cases = [
      { text: 'article 1 - Introduction\nSome content here.', expected: 'article 1' },
      { text: 'chapitre 2\nDetails follow.', expected: 'chapitre 2' },
      { text: '1. Methodologie\nSteps...', expected: '1. M' }, // Matches \d+[\.\)]\s+[A-Z]
      { text: '2) Application\nDetails...', expected: '2) A' }, // Matches \d+[\.\)]\s+[A-Z]
      { text: 'SECTION GENERALE\nMore text.', expected: 'SECTION GENERALE' },
      { text: 'Just regular text without title.', expected: undefined },
    ];

    cases.forEach(({ text, expected }) => {
      const result = chunkText(text, { maxChunkSize: 500 });
      expect(result[0].metadata.sectionTitle).toBe(expected);
    });
  });

  it('detects tables in chunks', () => {
    const textWithTable = `
      Regular text before table.
      |---|---|---|
      | Col1 | Col2 | Col3 |
      |---|---|---|
      More text after.
    `;
    const result = chunkText(textWithTable, { maxChunkSize: 500 });
    expect(result[0].metadata.hasTables).toBe(true);

    const textWithoutTable = 'Just regular text without any tables.';
    const resultNoTable = chunkText(textWithoutTable, { maxChunkSize: 500 });
    expect(resultNoTable[0].metadata.hasTables).toBe(false);
  });

  it('sets correct charOffset for each chunk', () => {
    const text = 'A'.repeat(2000) + '. ' + 'B'.repeat(2000) + '.';
    const result = chunkText(text, { maxChunkSize: 1500, overlapSize: 200 });

    expect(result[0].metadata.charOffset).toBe(0);
    expect(result[1].metadata.charOffset).toBeGreaterThan(0);

    // Each chunk offset should be less than the previous chunk's end
    for (let i = 1; i < result.length; i++) {
      expect(result[i].metadata.charOffset).toBeGreaterThan(result[i - 1].metadata.charOffset - 300);
    }
  });

  it('handles chunk index sequentially starting from 0', () => {
    const text = 'A'.repeat(5000) + '.';
    const result = chunkText(text, { maxChunkSize: 1000, overlapSize: 100 });

    result.forEach((chunk, i) => {
      expect(chunk.index).toBe(i);
    });
  });
});

// ─── Test Suite: rag.ts ───

describe('RAG System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isDocumentIndexed', () => {
    it('returns true when document exists in DB', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      // Mock successful query with data
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.limit.mockResolvedValue({ data: [{ id: '123' }], error: null });

      const result = await isDocumentIndexed('notice-123', 'user@test.com');
      expect(result).toBe(true);
    });

    it('returns false when document does not exist', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      // Mock query with no data
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.limit.mockResolvedValue({ data: [], error: null });

      const result = await isDocumentIndexed('notice-456', 'user@test.com');
      expect(result).toBe(false);
    });

    it('returns false when query returns null data', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.limit.mockResolvedValue({ data: null, error: null });

      const result = await isDocumentIndexed('notice-789', 'user@test.com');
      expect(result).toBe(false);
    });
  });

  describe('indexDCEDocument', () => {
    it('skips indexing if document already indexed', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      // Mock document already exists
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.limit.mockResolvedValue({ data: [{ id: '123' }], error: null });

      const params: IndexParams = {
        noticeId: 'notice-123',
        userEmail: 'user@test.com',
        text: 'Sample DCE text',
        summary: 'Sample summary',
      };

      const result = await indexDCEDocument(params);
      expect(result).toEqual({ indexed: false, chunkCount: 0 });
    });

    it('indexes document and returns chunk count', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const { createEmbeddings } = await import('@/lib/embeddings');
      const mockClient = getSupabase() as any;

      // Mock document does not exist
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.limit.mockResolvedValueOnce({ data: [], error: null });

      // Mock successful upsert
      mockClient.upsert.mockResolvedValue({ error: null });

      const longText = 'A'.repeat(5000) + '. Sample DCE content.';
      const params: IndexParams = {
        noticeId: 'notice-456',
        userEmail: 'user@test.com',
        text: longText,
        summary: 'Summary of DCE',
      };

      const result = await indexDCEDocument(params);

      expect(result.indexed).toBe(true);
      expect(result.chunkCount).toBeGreaterThan(0);

      // Verify embeddings were created
      expect(createEmbeddings).toHaveBeenCalled();
    });

    it('returns zero chunks for empty text', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      // Mock document does not exist
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.limit.mockResolvedValue({ data: [], error: null });

      const params: IndexParams = {
        noticeId: 'notice-789',
        userEmail: 'user@test.com',
        text: '',
      };

      const result = await indexDCEDocument(params);
      expect(result).toEqual({ indexed: false, chunkCount: 0 });
    });
  });

  describe('retrieveChunks', () => {
    it('retrieves chunks using vector similarity search', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const { createEmbedding } = await import('@/lib/embeddings');
      const mockClient = getSupabase() as any;

      const mockChunks = [
        {
          content: 'Chunk 1 content',
          summary: 'Summary',
          similarity: 0.95,
          chunk_index: 0,
          metadata: { hasTables: false },
        },
        {
          content: 'Chunk 2 content',
          summary: 'Summary',
          similarity: 0.87,
          chunk_index: 1,
          metadata: { hasTables: true },
        },
      ];

      mockClient.rpc.mockResolvedValue({ data: mockChunks, error: null });

      const params: RetrieveParams = {
        noticeId: 'notice-123',
        userEmail: 'user@test.com',
        query: 'test query',
        topK: 5,
        threshold: 0.3,
      };

      const result = await retrieveChunks(params);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Chunk 1 content');
      expect(result[0].similarity).toBe(0.95);
      expect(result[1].metadata.hasTables).toBe(true);

      // Verify embedding was created for query
      expect(createEmbedding).toHaveBeenCalledWith('test query', 'RETRIEVAL_QUERY');
    });

    it('handles empty results gracefully', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      mockClient.rpc.mockResolvedValue({ data: [], error: null });

      const params: RetrieveParams = {
        noticeId: 'notice-456',
        userEmail: 'user@test.com',
        query: 'no match',
      };

      const result = await retrieveChunks(params);
      expect(result).toEqual([]);
    });

    it('throws error on RPC failure', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      mockClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const params: RetrieveParams = {
        noticeId: 'notice-789',
        userEmail: 'user@test.com',
        query: 'test',
      };

      await expect(retrieveChunks(params)).rejects.toThrow('Chunk retrieval failed');
    });
  });

  describe('getRelevantContext', () => {
    it('falls back to truncated text when document not indexed', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      // Mock document does not exist
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.limit.mockResolvedValue({ data: [], error: null });

      const fullText = 'A'.repeat(20000);
      const result = await getRelevantContext({
        noticeId: 'notice-123',
        userEmail: 'user@test.com',
        query: 'test query',
        fullText,
      });

      expect(result.strategy).toBe('fallback');
      expect(result.chunkCount).toBe(0);
      expect(result.context).toBe(fullText.slice(0, 15000));
    });

    it('falls back to truncated text when too few relevant chunks', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      // Mock document exists
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.limit.mockResolvedValue({ data: [{ id: '123' }], error: null });

      // Mock only 1 chunk returned
      mockClient.rpc.mockResolvedValue({
        data: [
          {
            content: 'Only one chunk',
            summary: null,
            similarity: 0.8,
            chunk_index: 0,
            metadata: {},
          },
        ],
        error: null,
      });

      const fullText = 'Full document text';
      const result = await getRelevantContext({
        noticeId: 'notice-456',
        userEmail: 'user@test.com',
        query: 'test',
        fullText,
      });

      expect(result.strategy).toBe('fallback');
      expect(result.chunkCount).toBe(1);
    });

    it('returns RAG context when chunks available', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      // Mock document exists
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.limit.mockResolvedValue({ data: [{ id: '123' }], error: null });

      // Mock multiple chunks returned
      mockClient.rpc.mockResolvedValue({
        data: [
          {
            content: 'Chunk 3 content',
            summary: null,
            similarity: 0.75,
            chunk_index: 3,
            metadata: {},
          },
          {
            content: 'Chunk 1 content',
            summary: null,
            similarity: 0.95,
            chunk_index: 1,
            metadata: {},
          },
          {
            content: 'Chunk 2 content',
            summary: null,
            similarity: 0.85,
            chunk_index: 2,
            metadata: {},
          },
        ],
        error: null,
      });

      const result = await getRelevantContext({
        noticeId: 'notice-789',
        userEmail: 'user@test.com',
        query: 'test query',
        fullText: 'Full text',
        topK: 8,
      });

      expect(result.strategy).toBe('rag');
      expect(result.chunkCount).toBe(3);
      expect(result.context).toContain('Chunk 1 content');
      expect(result.context).toContain('Chunk 2 content');
      expect(result.context).toContain('Chunk 3 content');

      // Verify chunks are ordered by index (1, 2, 3 not similarity)
      const contextLines = result.context.split('\n\n---\n\n');
      expect(contextLines[0]).toBe('Chunk 1 content');
      expect(contextLines[1]).toBe('Chunk 2 content');
      expect(contextLines[2]).toBe('Chunk 3 content');
    });

    it('falls back gracefully on RAG failure', async () => {
      const { getSupabase } = await import('@/lib/supabase');
      const mockClient = getSupabase() as any;

      // Mock throws error
      mockClient.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const fullText = 'Fallback text content';
      const result = await getRelevantContext({
        noticeId: 'notice-error',
        userEmail: 'user@test.com',
        query: 'test',
        fullText,
      });

      expect(result.strategy).toBe('fallback');
      expect(result.chunkCount).toBe(0);
      expect(result.context).toBe(fullText.slice(0, 15000));
    });
  });
});
