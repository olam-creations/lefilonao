-- 020: Track AO views for free plan metering
CREATE TABLE IF NOT EXISTS ao_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL REFERENCES user_settings(user_email) ON DELETE CASCADE,
  notice_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  month_key TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ao_views_unique
  ON ao_views(user_email, notice_id, month_key);

CREATE INDEX IF NOT EXISTS idx_ao_views_month
  ON ao_views(user_email, month_key);
