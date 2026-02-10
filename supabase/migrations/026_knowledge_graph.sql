-- Phase 4: Knowledge Graph for market intelligence
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Entities: buyers, winners, CPV sectors, regions
CREATE TABLE IF NOT EXISTS kg_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('buyer','winner','cpv','region')),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_entities_type_ext
  ON kg_entities (entity_type, external_id);
CREATE INDEX IF NOT EXISTS idx_kg_entities_name_trgm
  ON kg_entities USING gin (name gin_trgm_ops);

-- Edges: relationships between entities
CREATE TABLE IF NOT EXISTS kg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL CHECK (edge_type IN (
    'awarded_to','contracts_in_sector','buyer_in_sector',
    'operates_in_region','buyer_in_region','competes_with'
  )),
  weight NUMERIC DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_id, target_id, edge_type)
);

CREATE INDEX IF NOT EXISTS idx_kg_edges_source ON kg_edges (source_id, edge_type);
CREATE INDEX IF NOT EXISTS idx_kg_edges_target ON kg_edges (target_id, edge_type);

-- Materialized view: top winners per buyer (pre-computed for fast lookups)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_buyer_top_winners AS
SELECT
  e_buyer.external_id AS buyer_id,
  e_buyer.name AS buyer_name,
  e_winner.external_id AS winner_id,
  e_winner.name AS winner_name,
  edge.weight AS contract_count,
  edge.metadata
FROM kg_edges edge
JOIN kg_entities e_buyer ON edge.source_id = e_buyer.id AND e_buyer.entity_type = 'buyer'
JOIN kg_entities e_winner ON edge.target_id = e_winner.id AND e_winner.entity_type = 'winner'
WHERE edge.edge_type = 'awarded_to'
ORDER BY e_buyer.external_id, edge.weight DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_buyer_top_winners
  ON mv_buyer_top_winners (buyer_id, winner_id);

-- N-hop neighbor traversal function (bounded depth, max 3)
CREATE OR REPLACE FUNCTION get_neighbors(
  p_entity_id UUID,
  p_max_depth INT DEFAULT 1,
  p_edge_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  entity_id UUID,
  entity_type TEXT,
  entity_name TEXT,
  external_id TEXT,
  edge_type TEXT,
  weight NUMERIC,
  depth INT
)
LANGUAGE plpgsql AS $$
BEGIN
  -- Clamp depth to max 3 for safety
  p_max_depth := LEAST(p_max_depth, 3);

  RETURN QUERY
  WITH RECURSIVE traversal AS (
    -- Base: direct neighbors
    SELECT
      CASE WHEN e.source_id = p_entity_id THEN e.target_id ELSE e.source_id END AS eid,
      e.edge_type AS etype,
      e.weight AS eweight,
      1 AS edepth
    FROM kg_edges e
    WHERE (e.source_id = p_entity_id OR e.target_id = p_entity_id)
      AND (p_edge_types IS NULL OR e.edge_type = ANY(p_edge_types))

    UNION ALL

    -- Recursive: neighbors of neighbors
    SELECT
      CASE WHEN e.source_id = t.eid THEN e.target_id ELSE e.source_id END,
      e.edge_type,
      e.weight,
      t.edepth + 1
    FROM traversal t
    JOIN kg_edges e ON (e.source_id = t.eid OR e.target_id = t.eid)
    WHERE t.edepth < p_max_depth
      AND (p_edge_types IS NULL OR e.edge_type = ANY(p_edge_types))
      AND CASE WHEN e.source_id = t.eid THEN e.target_id ELSE e.source_id END != p_entity_id
  )
  SELECT DISTINCT ON (n.id)
    n.id,
    n.entity_type,
    n.name,
    n.external_id,
    t.etype,
    t.eweight,
    t.edepth
  FROM traversal t
  JOIN kg_entities n ON n.id = t.eid
  ORDER BY n.id, t.edepth;
END;
$$;

-- RLS
ALTER TABLE kg_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY kg_entities_read_policy ON kg_entities FOR SELECT USING (true);
CREATE POLICY kg_edges_read_policy ON kg_edges FOR SELECT USING (true);
CREATE POLICY kg_entities_write_policy ON kg_entities FOR ALL USING (true);
CREATE POLICY kg_edges_write_policy ON kg_edges FOR ALL USING (true);
