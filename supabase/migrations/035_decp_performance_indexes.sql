-- 035: Performance indexes for DECP expansion (all sectors, 10 years)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decp_notification_date
  ON decp_attributions (notification_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decp_cpv_code
  ON decp_attributions (cpv_code);
