-- 034: Add 9 new columns to boamp_notices for fast filtering
-- These fields were previously only available via donnees JSONB extraction

ALTER TABLE boamp_notices
  ADD COLUMN IF NOT EXISTS buyer_city TEXT,
  ADD COLUMN IF NOT EXISTS buyer_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS is_alloti BOOLEAN,
  ADD COLUMN IF NOT EXISTS variantes_autorisees BOOLEAN,
  ADD COLUMN IF NOT EXISTS cautionnement TEXT,
  ADD COLUMN IF NOT EXISTS modalites_paiement TEXT,
  ADD COLUMN IF NOT EXISTS forme_juridique TEXT,
  ADD COLUMN IF NOT EXISTS date_envoi_publication DATE;

-- Indexes for geographic filtering
CREATE INDEX IF NOT EXISTS idx_boamp_buyer_city
  ON boamp_notices (buyer_city)
  WHERE buyer_city IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_boamp_buyer_postal_code
  ON boamp_notices (buyer_postal_code)
  WHERE buyer_postal_code IS NOT NULL;
