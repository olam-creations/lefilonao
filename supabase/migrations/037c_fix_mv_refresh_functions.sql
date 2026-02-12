-- 037c: Fix MV refresh functions to use non-concurrent refresh
-- CONCURRENTLY requires unique indexes on raw columns (not expressions like COALESCE).
-- Since our indexes use COALESCE for NULL handling, we use regular REFRESH instead.
-- This means brief unavailability during refresh (~seconds), which is acceptable for daily cron.

CREATE OR REPLACE FUNCTION refresh_mv_market_share()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW mv_market_share; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_buyer_winner_matrix()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW mv_buyer_winner_matrix; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_volume_trend()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW mv_volume_trend; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_competition_hhi()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW mv_competition_hhi; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_renewal_candidates()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW mv_renewal_candidates; END;
$$;

CREATE OR REPLACE FUNCTION refresh_mv_winner_profiles()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW mv_winner_profiles; END;
$$;
