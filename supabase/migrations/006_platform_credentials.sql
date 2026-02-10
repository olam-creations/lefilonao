-- Platform credentials for headless scraping authentication
CREATE TABLE platform_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_url TEXT,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  encrypted_iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_email, platform)
);

ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON platform_credentials
  FOR ALL
  USING (true)
  WITH CHECK (true);
