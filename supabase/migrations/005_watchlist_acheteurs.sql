CREATE TABLE user_watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_siret TEXT,
  added_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_watchlist_unique ON user_watchlist (user_email, buyer_name);
CREATE INDEX idx_watchlist_user ON user_watchlist (user_email);
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Service role full access (API routes use SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role full access" ON user_watchlist
  FOR ALL USING (true) WITH CHECK (true);
