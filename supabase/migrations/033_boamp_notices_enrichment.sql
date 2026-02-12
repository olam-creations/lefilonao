-- 033: Enrich boamp_notices with fields previously dropped during sync
ALTER TABLE boamp_notices
  ADD COLUMN IF NOT EXISTS type_marche TEXT,
  ADD COLUMN IF NOT EXISTS all_cpv_codes TEXT[],
  ADD COLUMN IF NOT EXISTS all_departements TEXT[],
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS duration_months INTEGER,
  ADD COLUMN IF NOT EXISTS criteria TEXT;

-- Index for filtering by type_marche (services, travaux, fournitures)
CREATE INDEX IF NOT EXISTS idx_boamp_type_marche ON boamp_notices(type_marche) WHERE type_marche IS NOT NULL;

-- GIN indexes for array containment queries (@>, &&)
CREATE INDEX IF NOT EXISTS idx_boamp_all_cpv_codes ON boamp_notices USING GIN (all_cpv_codes);
CREATE INDEX IF NOT EXISTS idx_boamp_all_departements ON boamp_notices USING GIN (all_departements);
