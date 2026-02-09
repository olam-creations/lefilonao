-- Founder feedback table
CREATE TABLE IF NOT EXISTS founder_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'idea', 'other')),
  message TEXT NOT NULL,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for reading feedback chronologically
CREATE INDEX idx_founder_feedback_created_at ON founder_feedback (created_at DESC);

-- RLS: allow inserts from service role (API route), read for service role only
ALTER TABLE founder_feedback ENABLE ROW LEVEL SECURITY;
