-- Migration 008: cột phục vụ xét điều kiện và xếp hạng học bổng (tính năng "AI gợi ý")
--   profiles     : thêm bậc học hiện tại, ngành, quốc tịch, năm sinh, kinh nghiệm, chứng chỉ
--   scholarships : thêm quốc tịch được nhận và tuổi tối đa
-- Bậc học, ngành, GPA tối thiểu, IELTS tối thiểu của học bổng đã có (degree, field_of_study, min_gpa, min_ielts).
-- Mọi cột đều cho phép NULL: học bổng không ghi yêu cầu thì là "Chưa rõ", không bị loại.
-- Chạy được nhiều lần (idempotent). Áp dụng bằng: node scripts/applyMigration.js --file=008_profileEligibility.sql
-- hoặc dán vào Supabase SQL Editor.

BEGIN;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_degree VARCHAR(20),
  ADD COLUMN IF NOT EXISTS major          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS nationality    CHAR(2),
  ADD COLUMN IF NOT EXISTS birth_year     SMALLINT,
  ADD COLUMN IF NOT EXISTS experience     TEXT,
  -- [{ "type": "ielts", "score": 7.0 }, …]: loại + điểm, giữ dạng JSON để thêm loại chứng chỉ không cần đổi bảng
  ADD COLUMN IF NOT EXISTS certificates   JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE scholarships
  -- Mã quốc gia ISO (VN, JP…). NULL = nhận mọi quốc tịch
  ADD COLUMN IF NOT EXISTS eligible_nationalities TEXT[],
  ADD COLUMN IF NOT EXISTS max_age                SMALLINT;

-- Chặn giá trị vô lý ở tầng DB (tầng zod ở BE vẫn kiểm trước)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_birth_year_range') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_birth_year_range
      CHECK (birth_year IS NULL OR birth_year BETWEEN 1940 AND 2100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_certificates_is_array') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_certificates_is_array
      CHECK (jsonb_typeof(certificates) = 'array');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scholarships_max_age_range') THEN
    ALTER TABLE scholarships ADD CONSTRAINT scholarships_max_age_range
      CHECK (max_age IS NULL OR max_age BETWEEN 10 AND 100);
  END IF;
END $$;

COMMIT;
