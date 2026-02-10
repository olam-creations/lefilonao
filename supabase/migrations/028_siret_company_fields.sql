-- SIRET Magic Onboarding: store enriched company data on user profile
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS siret TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS siren TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS naf_code TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS naf_label TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS company_city TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS company_postal_code TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS company_department TEXT;
