-- Migration 019: Silence rls_enabled_no_policy linter warnings
-- These user tables intentionally have RLS with no policies (from migration 017).
-- Adding explicit deny-all policies makes the intent clear and silences the linter.
-- Service role bypasses RLS entirely, so API routes are unaffected.

CREATE POLICY "deny_anon_authenticated" ON public.alert_matches
  FOR ALL USING (false);

CREATE POLICY "deny_anon_authenticated" ON public.user_alerts
  FOR ALL USING (false);

CREATE POLICY "deny_anon_authenticated" ON public.user_rfps
  FOR ALL USING (false);

CREATE POLICY "deny_anon_authenticated" ON public.user_settings
  FOR ALL USING (false);

CREATE POLICY "deny_anon_authenticated" ON public.user_watchlist
  FOR ALL USING (false);
