-- 013: Subventions publiques de l'Etat
-- Source: data.economie.gouv.fr — subventions associatives

CREATE TABLE IF NOT EXISTS subventions (
  id text PRIMARY KEY,
  beneficiaire_nom text NOT NULL,
  beneficiaire_siren text DEFAULT '',
  attribuant_nom text DEFAULT '',
  attribuant_siren text DEFAULT '',
  montant numeric DEFAULT 0,
  nature text DEFAULT '',
  objet text DEFAULT '',
  date_attribution date,
  exercice integer,
  region text DEFAULT '',
  departement text DEFAULT '',
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subventions_beneficiaire ON subventions(beneficiaire_siren);
CREATE INDEX idx_subventions_attribuant ON subventions(attribuant_siren);
CREATE INDEX idx_subventions_exercice ON subventions(exercice);
CREATE INDEX idx_subventions_region ON subventions(region);
