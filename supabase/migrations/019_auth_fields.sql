-- 019: Add local auth fields to user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '';
