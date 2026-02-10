-- Migration 023: Add composite index for decp_attributions market queries
-- Top 10 slowest queries all filter by cpv_sector, often with notification_date.
-- This single composite index covers: cpv_sector-only filters, cpv_sector + date range,
-- and cpv_sector + ORDER BY notification_date DESC.

CREATE INDEX idx_decp_cpv_sector_notif ON public.decp_attributions (cpv_sector, notification_date DESC);
