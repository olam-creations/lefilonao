ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  TEXT,
  ADD COLUMN IF NOT EXISTS stripe_status           TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS current_period_end      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end    BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_cust ON user_settings(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_sub  ON user_settings(stripe_subscription_id);
