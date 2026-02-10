-- Migration 020: Fix auth_rls_initplan and multiple_permissive_policies warnings
--
-- 1. Drop "service_role_all" from excalibur_subscribers, excalibur_rfps,
--    excalibur_notifications — service_role already bypasses RLS, so these
--    policies are unnecessary and cause the auth_rls_initplan perf warning
--    (current_setting() re-evaluated per row).
--
-- 2. Drop duplicate "anon_read" from excalibur_rfps and excalibur_notifications —
--    migration 017 already created "anon_read_excalibur_rfps" and
--    "anon_read_excalibur_notifs" which are equivalent.

-- ═══════════════════════════════════════════════════════════
-- 1. Remove unnecessary service_role_all policies (fixes auth_rls_initplan)
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_all" ON public.excalibur_subscribers;
DROP POLICY IF EXISTS "service_role_all" ON public.excalibur_rfps;
DROP POLICY IF EXISTS "service_role_all" ON public.excalibur_notifications;

-- ═══════════════════════════════════════════════════════════
-- 2. Remove duplicate anon_read policies (fixes multiple_permissive_policies)
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "anon_read" ON public.excalibur_rfps;
DROP POLICY IF EXISTS "anon_read" ON public.excalibur_notifications;
