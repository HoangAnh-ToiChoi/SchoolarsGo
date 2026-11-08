-- Migration 003: hỗ trợ kéo học bổng tự động (module src/ingestion)
-- Chạy được nhiều lần (idempotent). Áp dụng bằng: node scripts/applyMigration.js --file=003_ingestion.sql
-- hoặc dán vào Supabase SQL Editor.

BEGIN;

-- 1. Hạn nộp có thể chưa rõ → cho phép NULL (trước đây dùng ngày giả 2099-01-01)
ALTER TABLE scholarships ALTER COLUMN deadline DROP NOT NULL;

-- 2. Cột phục vụ nguồn dữ liệu bên ngoài
ALTER TABLE scholarships
  ADD COLUMN IF NOT EXISTS source_url       TEXT,               -- link bài đăng gốc, hiện trên giao diện
  ADD COLUMN IF NOT EXISTS summary          TEXT,               -- đoạn giới thiệu ngắn từ bài đăng
  ADD COLUMN IF NOT EXISTS relevance_score  SMALLINT NOT NULL DEFAULT 0,  -- 0..100, càng cao càng phù hợp sinh viên VN
  ADD COLUMN IF NOT EXISTS dedup_key        VARCHAR(300),       -- tiêu đề đã chuẩn hoá, chống trùng giữa các nguồn
  ADD COLUMN IF NOT EXISTS source_priority  SMALLINT,           -- ưu tiên của nguồn (nhỏ = ưu tiên hơn)
  ADD COLUMN IF NOT EXISTS published_at     TIMESTAMP;          -- ngày bài đăng gốc được đăng

CREATE UNIQUE INDEX IF NOT EXISTS uq_scholarships_dedup_key  ON scholarships(dedup_key)  WHERE dedup_key  IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_scholarships_source_url ON scholarships(source_url) WHERE source_url IS NOT NULL;
CREATE INDEX        IF NOT EXISTS idx_scholarships_relevance ON scholarships(relevance_score DESC);

-- 3. Nhật ký mỗi lần kéo: kéo bao nhiêu, loại bao nhiêu và vì luật nào
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    source        VARCHAR(100) NOT NULL,
    dry_run       BOOLEAN      NOT NULL DEFAULT false,
    started_at    TIMESTAMP    NOT NULL DEFAULT now(),
    finished_at   TIMESTAMP,
    fetched       INTEGER      NOT NULL DEFAULT 0,
    rejected      JSONB        NOT NULL DEFAULT '{}'::jsonb,   -- {"R1": 12, "R2": 40, ...}
    inserted      INTEGER      NOT NULL DEFAULT 0,
    updated       INTEGER      NOT NULL DEFAULT 0,
    skipped       INTEGER      NOT NULL DEFAULT 0,             -- trùng với học bổng đã có
    error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started ON ingestion_runs(started_at DESC);

COMMIT;
