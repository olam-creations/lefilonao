-- 035: Performance indexes for DECP expansion (all sectors, 10 years)
-- Note: no CONCURRENTLY — Management API wraps in transaction

CREATE INDEX IF NOT EXISTS idx_decp_notification_date
  ON decp_attributions (notification_date);

CREATE INDEX IF NOT EXISTS idx_decp_cpv_code
  ON decp_attributions (cpv_code);
