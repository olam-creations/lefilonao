-- Migration 017: RLS defense-in-depth
-- Ensures anon key users cannot access user-specific data.
-- Service role (used by API routes) bypasses RLS automatically.
--
-- Actual production tables (Feb 2026):
-- PUBLIC: decp_attributions, companies, boamp_notices, approch_projects,
--         bodacc_alerts, public_entities, subventions, rge_certifications,
--         jorf_alerts, excalibur_rfps, excalibur_subscribers, excalibur_notifications
-- USER: user_settings, user_rfps, user_alerts, alert_matches, user_watchlist

-- ═══════════════════════════════════════════════════════════
-- 1. PUBLIC DATA TABLES — Enable RLS + anon SELECT only
-- ═══════════════════════════════════════════════════════════

ALTER TABLE decp_attributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_decp" ON decp_attributions;
CREATE POLICY "anon_read_decp" ON decp_attributions FOR SELECT USING (true);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_companies" ON companies;
CREATE POLICY "anon_read_companies" ON companies FOR SELECT USING (true);

ALTER TABLE boamp_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_boamp" ON boamp_notices;
CREATE POLICY "anon_read_boamp" ON boamp_notices FOR SELECT USING (true);

ALTER TABLE approch_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_approch" ON approch_projects;
CREATE POLICY "anon_read_approch" ON approch_projects FOR SELECT USING (true);

ALTER TABLE bodacc_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_bodacc" ON bodacc_alerts;
CREATE POLICY "anon_read_bodacc" ON bodacc_alerts FOR SELECT USING (true);

ALTER TABLE public_entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_public_entities" ON public_entities;
CREATE POLICY "anon_read_public_entities" ON public_entities FOR SELECT USING (true);

ALTER TABLE subventions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_subventions" ON subventions;
CREATE POLICY "anon_read_subventions" ON subventions FOR SELECT USING (true);

ALTER TABLE rge_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_rge" ON rge_certifications;
CREATE POLICY "anon_read_rge" ON rge_certifications FOR SELECT USING (true);

ALTER TABLE jorf_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_jorf" ON jorf_alerts;
CREATE POLICY "anon_read_jorf" ON jorf_alerts FOR SELECT USING (true);

ALTER TABLE excalibur_rfps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_excalibur_rfps" ON excalibur_rfps;
CREATE POLICY "anon_read_excalibur_rfps" ON excalibur_rfps FOR SELECT USING (true);

ALTER TABLE excalibur_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_excalibur_notifs" ON excalibur_notifications;
CREATE POLICY "anon_read_excalibur_notifs" ON excalibur_notifications FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════
-- 2. USER DATA TABLES — Enable RLS, no anon policies = zero access
-- ═══════════════════════════════════════════════════════════
-- Service role bypasses RLS, so API routes still work.

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_matches ENABLE ROW LEVEL SECURITY;

-- user_watchlist already has RLS, drop overly permissive policy
DROP POLICY IF EXISTS "Service role full access" ON user_watchlist;

-- excalibur_subscribers has user emails — protect it
ALTER TABLE excalibur_subscribers ENABLE ROW LEVEL SECURITY;
