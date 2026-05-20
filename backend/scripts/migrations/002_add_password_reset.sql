-- Migration 002: Add password reset columns to users table
-- Run this once in Supabase SQL Editor

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token       VARCHAR(64),
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- (Optional) Normalize country data while you're here
-- UPDATE scholarships SET country = INITCAP(LOWER(TRIM(country))) WHERE country IS NOT NULL;
