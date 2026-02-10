-- 024: Pappers financial enrichment columns
-- All columns nullable → non-breaking, backward-compatible

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS score_financier INTEGER,
  ADD COLUMN IF NOT EXISTS score_financier_detail JSONB,
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ca_n1 BIGINT,
  ADD COLUMN IF NOT EXISTS ca_n2 BIGINT,
  ADD COLUMN IF NOT EXISTS ca_n3 BIGINT,
  ADD COLUMN IF NOT EXISTS marge_nette NUMERIC,
  ADD COLUMN IF NOT EXISTS endettement NUMERIC,
  ADD COLUMN IF NOT EXISTS tresorerie BIGINT,
  ADD COLUMN IF NOT EXISTS procedures_collectives JSONB;

CREATE INDEX IF NOT EXISTS idx_companies_score
  ON companies(score_financier)
  WHERE score_financier IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_procedures
  ON companies USING GIN (procedures_collectives)
  WHERE procedures_collectives IS NOT NULL;
