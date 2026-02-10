-- Track last visit for morning briefing delta calculation
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ DEFAULT NOW();

-- Index for fast delta queries on boamp_notices
CREATE INDEX IF NOT EXISTS idx_boamp_notices_pub_date_desc
  ON boamp_notices (publication_date DESC);

-- Index for fast delta queries on decp_attributions
CREATE INDEX IF NOT EXISTS idx_decp_attributions_notif_date_desc
  ON decp_attributions (notification_date DESC);
