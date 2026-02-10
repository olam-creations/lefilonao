-- 014: ADEME RGE certifications (Reconnu Garant de l'Environnement)
-- Source: data.ademe.fr — liste des entreprises RGE

CREATE TABLE IF NOT EXISTS rge_certifications (
  id text PRIMARY KEY,
  siret text NOT NULL,
  company_name text DEFAULT '',
  code_qualification text DEFAULT '',
  nom_qualification text DEFAULT '',
  organisme text DEFAULT '',
  domaine text DEFAULT '',
  date_debut date,
  date_fin date,
  adresse text DEFAULT '',
  code_postal text DEFAULT '',
  commune text DEFAULT '',
  departement text DEFAULT '',
  region text DEFAULT '',
  url_qualification text DEFAULT '',
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX idx_rge_siret ON rge_certifications(siret);
CREATE INDEX idx_rge_domaine ON rge_certifications(domaine);
CREATE INDEX idx_rge_dept ON rge_certifications(departement);
CREATE INDEX idx_rge_date_fin ON rge_certifications(date_fin);
