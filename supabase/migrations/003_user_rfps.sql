-- Pipeline: user-imported RFPs from opportunities
CREATE TABLE IF NOT EXISTS user_rfps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email    TEXT NOT NULL,
  notice_id     TEXT NOT NULL REFERENCES boamp_notices(id),
  score         INTEGER DEFAULT 50,
  score_label   TEXT DEFAULT 'MAYBE' CHECK (score_label IN ('GO', 'MAYBE', 'PASS')),
  notes         TEXT DEFAULT '',
  status        TEXT DEFAULT 'new' CHECK (status IN ('new', 'analyzing', 'go', 'no-go', 'submitted', 'won', 'lost')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, notice_id)
);

CREATE INDEX idx_user_rfps_email ON user_rfps(user_email);
CREATE INDEX idx_user_rfps_notice ON user_rfps(notice_id);
CREATE INDEX idx_user_rfps_status ON user_rfps(status);
