-- Migration 002: User Settings
-- Run in Supabase SQL editor (vdatbrdkwwedetdlbqxx.supabase.co)

CREATE TABLE IF NOT EXISTS user_settings (
  user_email       TEXT PRIMARY KEY,
  display_name     TEXT DEFAULT '',
  default_cpv      TEXT[] DEFAULT '{}',
  default_regions  TEXT[] DEFAULT '{}',
  default_keywords TEXT[] DEFAULT '{}',
  amount_min       NUMERIC DEFAULT 0,
  amount_max       NUMERIC DEFAULT 0,
  plan             TEXT DEFAULT 'free',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_plan ON user_settings(plan);
