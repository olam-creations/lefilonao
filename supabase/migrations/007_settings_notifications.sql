ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS notify_frequency TEXT DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT true;
