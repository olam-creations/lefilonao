-- Pre-computed DCE analyses (one row per AO, shared across all users)
CREATE TABLE IF NOT EXISTS dce_analyses (
  notice_id      TEXT PRIMARY KEY REFERENCES boamp_notices(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','fetching','analyzing','done','failed')),
  analysis       JSONB,
  fetch_method   TEXT,
  error_message  TEXT,
  retry_count    INTEGER DEFAULT 0,
  pdf_size_bytes INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at    TIMESTAMPTZ
);

-- Fast lookup by status for batch processing
CREATE INDEX idx_dce_analyses_status ON dce_analyses(status);

-- Pending/failed items for retry queue
CREATE INDEX idx_dce_analyses_pending ON dce_analyses(status, retry_count)
  WHERE status IN ('pending', 'failed');

-- RLS: service role only (no anon access needed)
ALTER TABLE dce_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY dce_analyses_service_only ON dce_analyses
  FOR ALL
  USING (auth.role() = 'service_role');
