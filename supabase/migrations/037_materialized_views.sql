-- 037: Materialized views for market intelligence
-- Replaces full-scan .limit(5000) queries with pre-aggregated data.
-- Each view has a UNIQUE INDEX for REFRESH MATERIALIZED VIEW CONCURRENTLY.

-- ─── 1. Market Share ────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_market_share AS
SELECT
  cpv_sector,
  region,
  winner_name,
  date_trunc('month', notification_date)::date AS month,
  COUNT(*)::int AS wins,
  COALESCE(SUM(amount), 0)::bigint AS total_volume,
  COALESCE(AVG(amount), 0)::int AS avg_amount
FROM decp_attributions
WHERE winner_name IS NOT NULL
  AND winner_name != ''
  AND notification_date IS NOT NULL
GROUP BY cpv_sector, region, winner_name, date_trunc('month', notification_date)::date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_market_share_pk
  ON mv_market_share (cpv_sector, winner_name, month);

-- ─── 2. Buyer-Winner Matrix ─────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_buyer_winner_matrix AS
SELECT
  buyer_name,
  winner_name,
  cpv_sector,
  COUNT(*)::int AS contract_count,
  COALESCE(SUM(amount), 0)::bigint AS total_volume,
  MIN(notification_date) AS first_contract,
  MAX(notification_date) AS last_contract
FROM decp_attributions
WHERE buyer_name IS NOT NULL AND buyer_name != ''
  AND winner_name IS NOT NULL AND winner_name != ''
GROUP BY buyer_name, winner_name, cpv_sector;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_buyer_winner_matrix_pk
  ON mv_buyer_winner_matrix (buyer_name, winner_name, cpv_sector);

-- ─── 3. Volume Trend ────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_volume_trend AS
SELECT
  cpv_sector,
  region,
  date_trunc('month', notification_date)::date AS month,
  COUNT(*)::int AS contract_count,
  COALESCE(SUM(amount), 0)::bigint AS total_volume
FROM decp_attributions
WHERE notification_date IS NOT NULL
GROUP BY cpv_sector, region, date_trunc('month', notification_date)::date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_volume_trend_pk
  ON mv_volume_trend (cpv_sector, region, month);

-- ─── 4. Competition HHI ─────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_competition_hhi AS
SELECT
  cpv_sector,
  COUNT(DISTINCT winner_name)::int AS unique_winners,
  COUNT(*)::int AS total_contracts,
  COALESCE(SUM(amount), 0)::bigint AS total_volume,
  ROUND(SUM(share_pct * share_pct))::int AS hhi
FROM (
  SELECT
    cpv_sector,
    winner_name,
    COUNT(*)::float / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY cpv_sector), 0) * 100 AS share_pct
  FROM decp_attributions
  WHERE winner_name IS NOT NULL AND winner_name != ''
  GROUP BY cpv_sector, winner_name
) sub
GROUP BY cpv_sector;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_competition_hhi_pk
  ON mv_competition_hhi (cpv_sector);

-- ─── 5. Renewal Candidates ──────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_renewal_candidates AS
SELECT
  id,
  title,
  buyer_name,
  winner_name,
  amount,
  notification_date,
  region,
  cpv_sector,
  (notification_date + INTERVAL '4 years')::date AS estimated_renewal
FROM decp_attributions
WHERE notification_date IS NOT NULL
  AND notification_date BETWEEN (CURRENT_DATE - INTERVAL '4 years') AND (CURRENT_DATE - INTERVAL '3 years')
  AND amount > 0
  AND winner_name IS NOT NULL AND winner_name != ''
  AND buyer_name IS NOT NULL AND buyer_name != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_renewal_candidates_pk
  ON mv_renewal_candidates (id);

-- ─── 6. Winner Profiles ─────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_winner_profiles AS
SELECT
  winner_name,
  winner_siret,
  COUNT(*)::int AS total_wins,
  COALESCE(SUM(amount), 0)::bigint AS total_volume,
  ARRAY_AGG(DISTINCT cpv_sector) FILTER (WHERE cpv_sector IS NOT NULL AND cpv_sector != '') AS sectors,
  ARRAY_AGG(DISTINCT region) FILTER (WHERE region IS NOT NULL AND region != '') AS regions,
  COUNT(DISTINCT buyer_name)::int AS unique_buyers
FROM decp_attributions
WHERE winner_name IS NOT NULL AND winner_name != ''
GROUP BY winner_name, winner_siret;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_winner_profiles_pk
  ON mv_winner_profiles (winner_name, winner_siret);

-- ─── Refresh Functions (callable via RPC) ───────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_mv_market_share()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY mv_market_share; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_buyer_winner_matrix()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY mv_buyer_winner_matrix; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_volume_trend()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY mv_volume_trend; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_competition_hhi()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY mv_competition_hhi; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_renewal_candidates()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY mv_renewal_candidates; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_winner_profiles()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY mv_winner_profiles; END;
$$;
