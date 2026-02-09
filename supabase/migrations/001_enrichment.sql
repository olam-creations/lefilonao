-- Migration 001: Enrichment - Extend decp_attributions + companies + boamp_notices + alerts
-- Run in Supabase SQL editor (vdatbrdkwwedetdlbqxx.supabase.co)

-- ─── 1. Extend decp_attributions with co-traitance & metadata ───

ALTER TABLE decp_attributions
  ADD COLUMN IF NOT EXISTS winner_siret_2 TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS winner_siret_3 TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS winner_name_2 TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS winner_name_3 TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS groupement_type TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration_months INTEGER,
  ADD COLUMN IF NOT EXISTS offers_received INTEGER,
  ADD COLUMN IF NOT EXISTS price_form TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_innovative BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS subcontracting TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_clause BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS environmental_clause BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT '';

-- ─── 2. Companies table (Sirene + Pappers enrichment) ───

CREATE TABLE IF NOT EXISTS companies (
  siret              TEXT PRIMARY KEY,
  siren              TEXT,
  name               TEXT NOT NULL,
  category           TEXT,
  naf_code           TEXT,
  naf_label          TEXT,
  date_creation      DATE,
  effectif_tranche   TEXT,
  effectif_label     TEXT,
  adresse            TEXT,
  code_postal        TEXT,
  ville              TEXT,
  departement        TEXT,
  region             TEXT,
  latitude           DOUBLE PRECISION,
  longitude          DOUBLE PRECISION,
  ca_dernier         BIGINT,
  resultat_net       BIGINT,
  est_rge            BOOLEAN DEFAULT false,
  est_organisme_formation BOOLEAN DEFAULT false,
  etat_administratif TEXT,
  source             TEXT DEFAULT 'sirene',
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category);
CREATE INDEX IF NOT EXISTS idx_companies_naf ON companies(naf_code);
CREATE INDEX IF NOT EXISTS idx_companies_region ON companies(region);
CREATE INDEX IF NOT EXISTS idx_companies_siren ON companies(siren);

-- ─── 3. BOAMP notices (open tenders) ───

CREATE TABLE IF NOT EXISTS boamp_notices (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  buyer_name         TEXT,
  buyer_siret        TEXT,
  cpv_code           TEXT,
  cpv_sector         TEXT,
  deadline           TIMESTAMPTZ,
  publication_date   TIMESTAMPTZ,
  dce_url            TEXT,
  region             TEXT,
  departement        TEXT,
  nature             TEXT,
  procedure_type     TEXT,
  lots_count         INTEGER DEFAULT 1,
  estimated_amount   NUMERIC,
  description        TEXT,
  source             TEXT DEFAULT 'boamp',
  is_open            BOOLEAN DEFAULT true,
  synced_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boamp_cpv ON boamp_notices(cpv_sector);
CREATE INDEX IF NOT EXISTS idx_boamp_deadline ON boamp_notices(deadline);
CREATE INDEX IF NOT EXISTS idx_boamp_region ON boamp_notices(region);
CREATE INDEX IF NOT EXISTS idx_boamp_open ON boamp_notices(is_open);
CREATE INDEX IF NOT EXISTS idx_boamp_publication ON boamp_notices(publication_date DESC);

-- ─── 4. User alerts ───

CREATE TABLE IF NOT EXISTS user_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email       TEXT NOT NULL,
  label            TEXT,
  cpv_sectors      TEXT[] DEFAULT '{}',
  regions          TEXT[] DEFAULT '{}',
  keywords         TEXT[] DEFAULT '{}',
  amount_min       NUMERIC DEFAULT 0,
  amount_max       NUMERIC DEFAULT 0,
  notify_email     BOOLEAN DEFAULT true,
  notify_inapp     BOOLEAN DEFAULT true,
  active           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON user_alerts(user_email);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON user_alerts(active);

-- ─── 5. Alert matches ───

CREATE TABLE IF NOT EXISTS alert_matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id         UUID REFERENCES user_alerts(id) ON DELETE CASCADE,
  notice_id        TEXT REFERENCES boamp_notices(id),
  matched_at       TIMESTAMPTZ DEFAULT NOW(),
  seen             BOOLEAN DEFAULT false,
  emailed          BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_matches_alert ON alert_matches(alert_id);
CREATE INDEX IF NOT EXISTS idx_matches_unseen ON alert_matches(seen) WHERE seen = false;
CREATE INDEX IF NOT EXISTS idx_matches_notice ON alert_matches(notice_id);
