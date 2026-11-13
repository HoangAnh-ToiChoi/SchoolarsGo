CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  previous_token_hash TEXT,
  rotated_at TIMESTAMPTZ,
  device_name TEXT,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active
  ON user_sessions(user_id, last_used_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry ON user_sessions(expires_at);
