-- Migration 018: Fix Supabase linter warnings
-- 1. Set search_path on all public functions (prevents search path injection)
-- 2. Revoke anon/authenticated access on materialized views

-- ═══════════════════════════════════════════════════════════
-- 1. Fix function_search_path_mutable warnings
-- ═══════════════════════════════════════════════════════════

ALTER FUNCTION public.increment_rfp_usage SET search_path = '';
ALTER FUNCTION public.get_dashboard_rfps SET search_path = '';
ALTER FUNCTION public.get_matching_subscribers SET search_path = '';
ALTER FUNCTION public.refresh_pipeline_health_mv SET search_path = '';
ALTER FUNCTION public.reset_monthly_rfp_usage SET search_path = '';

-- ═══════════════════════════════════════════════════════════
-- 2. Fix materialized_view_in_api warning
-- ═══════════════════════════════════════════════════════════

REVOKE SELECT ON public.excalibur_pipeline_health_mv FROM anon, authenticated;
