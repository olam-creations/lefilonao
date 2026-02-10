-- 011: BODACC alerts + company health status
-- Source: bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales

CREATE TABLE IF NOT EXISTS bodacc_alerts (
  id text PRIMARY KEY,
  siren text DEFAULT '',
  company_name text NOT NULL,
  alert_type text NOT NULL,
  alert_severity text DEFAULT 'info',
  publication_date date NOT NULL,
  tribunal text DEFAULT '',
  ville text DEFAULT '',
  region text DEFAULT '',
  description text DEFAULT '',
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bodacc_siren ON bodacc_alerts(siren);
CREATE INDEX idx_bodacc_type ON bodacc_alerts(alert_type);

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS health_status text DEFAULT 'healthy',
  ADD COLUMN IF NOT EXISTS health_updated_at timestamptz;
