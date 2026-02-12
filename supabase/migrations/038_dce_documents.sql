-- DCE Document Hub: individual document tracking per notice
-- Enables lazy discovery + R2 caching of all DCE documents

-- Discovery status on the notice itself
ALTER TABLE boamp_notices
  ADD COLUMN IF NOT EXISTS dce_discovery_status TEXT
    CHECK (dce_discovery_status IN ('pending','discovering','done','failed','no_url'));

-- Individual DCE documents table
CREATE TABLE IF NOT EXISTS dce_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id      TEXT NOT NULL REFERENCES boamp_notices(id) ON DELETE CASCADE,
  original_url   TEXT NOT NULL,
  filename       TEXT NOT NULL,
  file_size      INTEGER,
  mime_type      TEXT,
  category       TEXT NOT NULL DEFAULT 'autre'
                   CHECK (category IN (
                     'rc','ccap','cctp','bpu','dqe','dpgf','ae',
                     'dc1','dc2','dc3','dc4',
                     'plan','annexe','avis','bordereau','memoire','autre'
                   )),
  r2_key         TEXT,
  cached_at      TIMESTAMPTZ,
  discovery_status TEXT NOT NULL DEFAULT 'listed'
                   CHECK (discovery_status IN ('listed','downloading','cached','failed')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (notice_id, original_url)
);

-- Fast lookup by notice
CREATE INDEX idx_dce_documents_notice_id ON dce_documents(notice_id);

-- RLS: service role only (API routes use service key)
ALTER TABLE dce_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY dce_documents_service_only ON dce_documents
  FOR ALL
  USING (auth.role() = 'service_role');
