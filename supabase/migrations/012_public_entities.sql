-- 012: Annuaire des etablissements publics (acheteurs potentiels)
-- Source: api-lannuaire.service-public.gouv.fr (OpenDataSoft)

CREATE TABLE IF NOT EXISTS public_entities (
  id text PRIMARY KEY,
  nom text NOT NULL,
  type_service text DEFAULT '',
  adresse text DEFAULT '',
  code_postal text DEFAULT '',
  commune text DEFAULT '',
  departement text DEFAULT '',
  region text DEFAULT '',
  telephone text DEFAULT '',
  email text DEFAULT '',
  url text DEFAULT '',
  siren text DEFAULT '',
  latitude double precision,
  longitude double precision,
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX idx_public_entities_type ON public_entities(type_service);
CREATE INDEX idx_public_entities_dept ON public_entities(departement);
CREATE INDEX idx_public_entities_region ON public_entities(region);
CREATE INDEX idx_public_entities_siren ON public_entities(siren);
