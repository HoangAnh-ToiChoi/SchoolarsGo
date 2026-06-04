-- Migration 003: Add OAuth identity linking table
-- Run this once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_oauth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255) NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NULL,

  CONSTRAINT user_oauth_identities_provider_user_unique UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_oauth_identities_user_id
  ON user_oauth_identities(user_id);

CREATE INDEX IF NOT EXISTS idx_user_oauth_identities_provider_email
  ON user_oauth_identities(provider_email)
  WHERE provider_email IS NOT NULL;
