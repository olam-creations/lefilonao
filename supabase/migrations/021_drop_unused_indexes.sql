-- Migration 021: Drop unused indexes flagged by Supabase linter
-- These indexes have never been used. They can be recreated if needed:
--   CREATE INDEX CONCURRENTLY idx_name ON table_name (column);

-- excalibur_notifications
DROP INDEX IF EXISTS idx_notif_subscriber;
DROP INDEX IF EXISTS idx_notif_sent;

-- decp_attributions
DROP INDEX IF EXISTS idx_decp_amount;

-- excalibur_subscribers
DROP INDEX IF EXISTS idx_sub_tier;
DROP INDEX IF EXISTS idx_sub_active;

-- approch_projects
DROP INDEX IF EXISTS idx_approch_cpv;
DROP INDEX IF EXISTS idx_approch_region;

-- companies
DROP INDEX IF EXISTS idx_companies_category;
DROP INDEX IF EXISTS idx_companies_naf;
DROP INDEX IF EXISTS idx_companies_region;
DROP INDEX IF EXISTS idx_companies_siren;

-- bodacc_alerts
DROP INDEX IF EXISTS idx_bodacc_siren;
DROP INDEX IF EXISTS idx_bodacc_type;

-- public_entities
DROP INDEX IF EXISTS idx_public_entities_type;
DROP INDEX IF EXISTS idx_public_entities_dept;
DROP INDEX IF EXISTS idx_public_entities_region;
DROP INDEX IF EXISTS idx_public_entities_siren;

-- subventions
DROP INDEX IF EXISTS idx_subventions_beneficiaire;
DROP INDEX IF EXISTS idx_subventions_attribuant;
DROP INDEX IF EXISTS idx_subventions_exercice;
DROP INDEX IF EXISTS idx_subventions_region;

-- rge_certifications
DROP INDEX IF EXISTS idx_rge_siret;
DROP INDEX IF EXISTS idx_rge_domaine;
DROP INDEX IF EXISTS idx_rge_dept;

-- jorf_alerts
DROP INDEX IF EXISTS idx_jorf_date;
DROP INDEX IF EXISTS idx_jorf_nature;

-- excalibur_rfps
DROP INDEX IF EXISTS idx_rfps_deadline;
DROP INDEX IF EXISTS idx_rfps_enrichment_gin;

-- user_settings
DROP INDEX IF EXISTS idx_user_settings_plan;

-- user_rfps
DROP INDEX IF EXISTS idx_user_rfps_notice;
DROP INDEX IF EXISTS idx_user_rfps_status;

-- user_alerts
DROP INDEX IF EXISTS idx_alerts_active;

-- alert_matches
DROP INDEX IF EXISTS idx_matches_notice;
