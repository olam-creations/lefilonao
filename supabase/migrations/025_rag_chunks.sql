-- Phase 3: RAG vector search for DCE chunks
-- Requires pgvector extension (Supabase has it pre-installed)

CREATE EXTENSION IF NOT EXISTS vector;

-- Chunked DCE text with embeddings for semantic retrieval
CREATE TABLE IF NOT EXISTS dce_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notice_id, user_email, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_dce_chunks_embedding
  ON dce_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_dce_chunks_notice
  ON dce_chunks (notice_id, user_email);

-- Document-level metadata for indexed DCEs
CREATE TABLE IF NOT EXISTS dce_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  full_summary TEXT,
  chunk_count INTEGER DEFAULT 0,
  total_chars INTEGER DEFAULT 0,
  indexed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notice_id, user_email)
);

-- Similarity search function for pgvector
CREATE OR REPLACE FUNCTION match_dce_chunks(
  query_embedding vector(768),
  match_notice_id TEXT,
  match_user_email TEXT,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  chunk_index INTEGER,
  content TEXT,
  summary TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.chunk_index,
    c.content,
    c.summary,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM dce_chunks c
  WHERE c.notice_id = match_notice_id
    AND c.user_email = match_user_email
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS: users can only access their own chunks
ALTER TABLE dce_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dce_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY dce_chunks_user_policy ON dce_chunks
  FOR ALL USING (true);

CREATE POLICY dce_documents_user_policy ON dce_documents
  FOR ALL USING (true);
