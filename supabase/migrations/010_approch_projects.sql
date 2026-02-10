-- 010: APProch — Projets d'achats publics (pre-publication)
-- Source: data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/projets-dachats-publics

CREATE TABLE IF NOT EXISTS approch_projects (
  code integer PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT '',
  buyer_siren text DEFAULT '',
  buyer_name text DEFAULT '',
  cpv_codes text DEFAULT '',
  cpv_sector text DEFAULT '',
  estimated_amount text DEFAULT '',
  duration_months integer,
  expected_publication_date date,
  expected_deadline date,
  procedure_type text DEFAULT '',
  link text DEFAULT '',
  region text DEFAULT '',
  departement text DEFAULT '',
  considerations_sociales text DEFAULT '',
  considerations_environnementales text DEFAULT '',
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX idx_approch_cpv ON approch_projects(cpv_sector);
CREATE INDEX idx_approch_region ON approch_projects(region);
CREATE INDEX idx_approch_pub_date ON approch_projects(expected_publication_date);
