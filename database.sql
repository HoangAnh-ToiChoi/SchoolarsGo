-- ============================================================
-- SCHOLARSGO — DATABASE SCHEMA MIGRATION
-- Version: v0.2 | Date: 27/3/2026
-- Description: Initial schema — 6 tables with indexes and RLS
-- ============================================================
--
-- MIGRATION v0.3 | Date: 31/3/2026
-- Thêm unique constraint + tăng country VARCHAR(100→255) tránh lỗi seed
ALTER TABLE scholarships ADD CONSTRAINT scholarships_title_key UNIQUE (title);
ALTER TABLE scholarships ALTER COLUMN country TYPE VARCHAR(255);

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    avatar_url    TEXT        NULL,
    phone         VARCHAR(20) NULL,
    date_of_birth DATE        NULL,
    created_at    TIMESTAMP   DEFAULT now(),
    updated_at    TIMESTAMP   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- 2. PROFILES  (FK → users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio             TEXT         NULL,
    gpa             DECIMAL(3,2) NULL CHECK (gpa IS NULL OR (gpa >= 0 AND gpa <= 4)),
    gpa_scale       VARCHAR(10)  NULL DEFAULT '4.0',
    english_level   VARCHAR(50)  NULL,
    target_country  VARCHAR(100) NULL,
    target_major    VARCHAR(255) NULL,
    target_degree   VARCHAR(50)  NULL,
    target_intake   VARCHAR(50)  NULL,
    created_at      TIMESTAMP    DEFAULT now(),
    updated_at      TIMESTAMP    DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_gpa     ON profiles(gpa);

-- ============================================================
-- 3. DOCUMENTS  (FK → users)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50)  NOT NULL,
    file_name   VARCHAR(255) NOT NULL,
    file_url    TEXT         NOT NULL,
    file_size   INTEGER      NOT NULL,
    mime_type   VARCHAR(100) NOT NULL,
    is_verified BOOLEAN      DEFAULT false,
    created_at  TIMESTAMP    DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type    ON documents(type);

-- ============================================================
-- 4. SCHOLARSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS scholarships (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500)  UNIQUE NOT NULL,
    provider        VARCHAR(255)   NOT NULL,
    country         VARCHAR(100)  NOT NULL,
    city            VARCHAR(255)  NULL,
    university      VARCHAR(255)  NULL,
    degree          VARCHAR(50)   NOT NULL,
    field_of_study  VARCHAR(255)  NULL,
    amount          DECIMAL(12,2) NULL,
    currency        VARCHAR(10)   DEFAULT 'USD',
    coverage        VARCHAR(255)  NULL,
    deadline        TIMESTAMP     NOT NULL,
    intake          VARCHAR(50)  NULL,
    language        VARCHAR(50)  NULL,
    min_gpa         DECIMAL(3,2) NULL,
    min_ielts       DECIMAL(2,1) NULL,
    eligibility     TEXT          NULL,
    requirements    TEXT          NULL,
    benefits        TEXT          NULL,
    application_url TEXT          NULL,
    image_url       TEXT          NULL,
    is_featured     BOOLEAN       DEFAULT false,
    is_active       BOOLEAN       DEFAULT true,
    source          VARCHAR(100)  NULL,
    created_at      TIMESTAMP     DEFAULT now(),
    updated_at      TIMESTAMP     DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scholarships_country      ON scholarships(country);
CREATE INDEX IF NOT EXISTS idx_scholarships_degree       ON scholarships(degree);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline    ON scholarships(deadline);
CREATE INDEX IF NOT EXISTS idx_scholarships_field       ON scholarships(field_of_study);
CREATE INDEX IF NOT EXISTS idx_scholarships_language    ON scholarships(language);
CREATE INDEX IF NOT EXISTS idx_scholarships_min_gpa     ON scholarships(min_gpa);

-- ============================================================
-- 5. APPLICATIONS  (FK → users, scholarships)
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scholarship_id  UUID        NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    status          VARCHAR(50) DEFAULT 'draft',
    applied_at      TIMESTAMP   NULL,
    notes           TEXT        NULL,
    checklist       JSONB       DEFAULT '[]',
    documents_used  JSONB       DEFAULT '[]',
    result          TEXT        NULL,
    created_at      TIMESTAMP   DEFAULT now(),
    updated_at      TIMESTAMP   DEFAULT now(),

    CONSTRAINT unique_user_scholarship UNIQUE (user_id, scholarship_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id        ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_scholarship_id  ON applications(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status          ON applications(status);

-- ============================================================
-- 6. SAVED_SCHOLARSHIPS  (FK → users, scholarships)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_scholarships (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scholarship_id  UUID        NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    note            TEXT        NULL,
    created_at      TIMESTAMP   DEFAULT now(),

    CONSTRAINT unique_saved_user_scholarship UNIQUE (user_id, scholarship_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user_id ON saved_scholarships(user_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Bật RLS cho tất cả tables
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_scholarships  ENABLE ROW LEVEL SECURITY;

-- 7a. users: chỉ chính mình đọc/sửa
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 7b. profiles: chỉ chính mình đọc/sửa
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = profiles.user_id AND auth.uid() = users.id)
    );

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = profiles.user_id AND auth.uid() = users.id)
    );

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 7c. documents: chỉ chính mình đọc/sửa
CREATE POLICY "documents_select_own" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_own" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_delete_own" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- 7d. scholarships: public read (anonymous)
CREATE POLICY "scholarships_public_read" ON scholarships
    FOR SELECT USING (true);

CREATE POLICY "scholarships_admin_insert" ON scholarships
    FOR INSERT WITH CHECK (true); -- restrict later with admin role check

CREATE POLICY "scholarships_admin_update" ON scholarships
    FOR UPDATE USING (true);

-- 7e. applications: chỉ chính mình đọc/sửa
CREATE POLICY "applications_select_own" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "applications_insert_own" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_update_own" ON applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "applications_delete_own" ON applications
    FOR DELETE USING (auth.uid() = user_id);

-- 7f. saved_scholarships: chỉ chính mình đọc/sửa
CREATE POLICY "saved_select_own" ON saved_scholarships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_insert_own" ON saved_scholarships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_delete_own" ON saved_scholarships
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 8. UPDATED_AT TRIGGER (auto-update updated_at)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scholarships_updated_at
    BEFORE UPDATE ON scholarships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- END OF MIGRATION v0.2
-- ============================================================
