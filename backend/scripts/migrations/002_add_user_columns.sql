-- Migration 002: Add missing columns to users table
-- Required by admin module (role, is_active, last_login_at)
-- Safe to run multiple times — uses ADD COLUMN IF NOT EXISTS

ALTER TABLE users ADD COLUMN IF NOT EXISTS role          VARCHAR(20)  NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active     BOOLEAN      NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP    NULL;

-- Index cho admin user listing
CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
