-- 036: Entity mappings for cross-source entity resolution
-- Additive table — never mutates source tables. MVs/graph JOIN against it.

CREATE TABLE IF NOT EXISTS entity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  canonical_siret TEXT,
  canonical_siren TEXT,
  confidence FLOAT NOT NULL DEFAULT 1.0,
  method TEXT NOT NULL DEFAULT 'exact',
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_mappings_siret
  ON entity_mappings (canonical_siret)
  WHERE canonical_siret IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_mappings_siren
  ON entity_mappings (canonical_siren)
  WHERE canonical_siren IS NOT NULL;
