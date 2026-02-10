-- 009: Add Annuaire des Entreprises fields to companies
-- Sirene API already returns finances, dirigeants, complements — we now store them.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS nature_juridique text DEFAULT '',
  ADD COLUMN IF NOT EXISTS nombre_etablissements integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nombre_etablissements_ouverts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dirigeants jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS complements jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS est_ess boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS est_societe_mission boolean DEFAULT false;
