-- Migration 009: index cho tìm kiếm theo từ khóa và thứ tự mặc định của danh sách học bổng
-- (007 để trống cho cột users ở đợt sau.)
-- Chạy được nhiều lần (idempotent). Áp dụng bằng: node scripts/applyMigration.js --file=009_searchIndexes.sql
-- hoặc dán vào Supabase SQL Editor. Không xóa index cũ: chưa chắc production đang có những index nào.

BEGIN;

-- Tìm kiếm dùng title/provider ILIKE '%từ khóa%': B-tree không dùng được, cần trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_scholarships_title_trgm
  ON scholarships USING gin (title extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_scholarships_provider_trgm
  ON scholarships USING gin (provider extensions.gin_trgm_ops);

-- Danh sách, nổi bật, gợi ý đều lọc is_active rồi sắp relevance_score DESC, deadline ASC
CREATE INDEX IF NOT EXISTS idx_scholarships_active_relevance_deadline
  ON scholarships (relevance_score DESC, deadline ASC NULLS LAST)
  WHERE is_active = true;

COMMIT;
