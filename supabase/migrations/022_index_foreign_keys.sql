-- Migration 022: Add covering indexes for foreign keys
-- These are required for FK constraint performance (JOIN, CASCADE DELETE).

CREATE INDEX IF NOT EXISTS idx_alert_matches_notice_id ON public.alert_matches (notice_id);
CREATE INDEX IF NOT EXISTS idx_user_rfps_notice_id ON public.user_rfps (notice_id);
