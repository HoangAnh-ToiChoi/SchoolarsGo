-- Migration 004: thêm slug cho học bổng để URL trang chi tiết dễ đọc
--   /scholarships/chevening-scholarship-2027-28  thay cho  /scholarships/<uuid>
-- Chạy được nhiều lần (idempotent). Áp dụng bằng: node scripts/applyMigration.js --file=004_scholarshipSlug.sql
-- hoặc dán vào Supabase SQL Editor.

BEGIN;

-- Bỏ dấu tiếng Việt khi tạo slug; Supabase đặt extension trong schema "extensions"
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS slug VARCHAR(120);

-- "Học bổng Chevening 2027/28" → "hoc-bong-chevening-2027-28"
CREATE OR REPLACE FUNCTION scholarship_slugify(input TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE
SET search_path = public, extensions
AS $$
  -- cắt 100 ký tự trước rồi mới bỏ '-' ở hai đầu, để slug không kết thúc bằng '-'
  SELECT trim(BOTH '-' FROM left(
    regexp_replace(lower(unaccent(replace(replace(coalesce(input, ''), 'đ', 'd'), 'Đ', 'D'))), '[^a-z0-9]+', '-', 'g'),
    100
  ));
$$;

-- Gán slug cho học bổng đang có. Tiêu đề trùng nhau thì thêm -2, -3… theo thứ tự tạo.
WITH ranked AS (
  SELECT id,
         scholarship_slugify(title) AS base,
         row_number() OVER (PARTITION BY scholarship_slugify(title) ORDER BY created_at, id) AS rn
  FROM scholarships
  WHERE slug IS NULL
)
UPDATE scholarships s
SET slug = CASE WHEN r.rn = 1 THEN r.base ELSE r.base || '-' || r.rn END
FROM ranked r
WHERE s.id = r.id;

-- Học bổng thêm mới (kể cả do module ingestion) tự có slug.
-- Slug chỉ tạo một lần, không đổi khi sửa tiêu đề, để link đã chia sẻ không bị hỏng.
CREATE OR REPLACE FUNCTION scholarships_set_slug() RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  base TEXT;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := scholarship_slugify(NEW.title);
    IF base = '' THEN base := 'hoc-bong'; END IF;
    NEW.slug := base;
    IF EXISTS (SELECT 1 FROM scholarships WHERE slug = NEW.slug AND id IS DISTINCT FROM NEW.id) THEN
      NEW.slug := base || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scholarships_set_slug ON scholarships;
CREATE TRIGGER trg_scholarships_set_slug
  BEFORE INSERT OR UPDATE OF slug ON scholarships
  FOR EACH ROW EXECUTE FUNCTION scholarships_set_slug();

CREATE UNIQUE INDEX IF NOT EXISTS uq_scholarships_slug ON scholarships(slug);

COMMIT;
