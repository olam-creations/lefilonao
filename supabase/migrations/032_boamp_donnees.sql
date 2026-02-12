-- 032: Store complete BOAMP donnees JSON blobs (separated from boamp_notices to keep listing queries fast)
CREATE TABLE IF NOT EXISTS boamp_donnees (
  notice_id TEXT PRIMARY KEY REFERENCES boamp_notices(id) ON DELETE CASCADE,
  donnees JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE boamp_donnees IS 'Complete raw donnees JSON from BOAMP API — contact, criteria, duration, conditions, variants';

-- RLS: service role only (worker writes, API reads via service key)
-- Service role bypasses RLS entirely. Deny-all policy silences linter warnings.
ALTER TABLE boamp_donnees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_authenticated" ON boamp_donnees
  FOR ALL USING (false);
