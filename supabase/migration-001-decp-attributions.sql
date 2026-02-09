-- Migration: Create decp_attributions table for DECP market data
-- Run this in the Supabase SQL editor (vdatbrdkwwedetdlbqxx.supabase.co)

CREATE TABLE IF NOT EXISTS decp_attributions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  buyer_name TEXT,
  buyer_siret TEXT,
  winner_name TEXT,
  winner_siret TEXT,
  amount NUMERIC,
  cpv_code TEXT,
  cpv_sector TEXT,
  notification_date DATE,
  region TEXT,
  lieu_execution TEXT,
  nature TEXT,
  procedure_type TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decp_cpv_sector ON decp_attributions(cpv_sector);
CREATE INDEX IF NOT EXISTS idx_decp_date ON decp_attributions(notification_date DESC);
CREATE INDEX IF NOT EXISTS idx_decp_region ON decp_attributions(region);
CREATE INDEX IF NOT EXISTS idx_decp_amount ON decp_attributions(amount);
CREATE INDEX IF NOT EXISTS idx_decp_buyer ON decp_attributions(buyer_name);
CREATE INDEX IF NOT EXISTS idx_decp_winner ON decp_attributions(winner_name);
