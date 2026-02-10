-- 015: JORF regulatory monitoring (marches publics)
-- Source: journal-officiel.gouv.fr (OpenDataSoft)

CREATE TABLE IF NOT EXISTS jorf_alerts (
  id text PRIMARY KEY,
  title text NOT NULL,
  nature text DEFAULT '',
  publication_date date NOT NULL,
  signatory text DEFAULT '',
  nor_code text DEFAULT '',
  url text DEFAULT '',
  keywords_matched text DEFAULT '',
  description text DEFAULT '',
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX idx_jorf_date ON jorf_alerts(publication_date);
CREATE INDEX idx_jorf_nature ON jorf_alerts(nature);
