/**
 * Migration: Add performance indexes
 *
 * Chạy: psql "postgresql://..." -f scripts/migrations/001_add_indexes.sql
 * Hoặc chạy qua Supabase SQL Editor trên Dashboard.
 */

-- Composite index cho applications — phổ biến nhất: lọc theo user + scholarship
CREATE INDEX IF NOT EXISTS idx_applications_user_scholarship
  ON applications(user_id, scholarship_id);

-- Index cho lọc theo status (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_applications_status
  ON applications(status);

-- Composite index cho saved scholarships
CREATE INDEX IF NOT EXISTS idx_saved_user_scholarship
  ON saved(user_id, scholarship_id);

-- Index cho scholarships: lọc theo quốc gia + featured
CREATE INDEX IF NOT EXISTS idx_scholarships_country_featured
  ON scholarships(country, is_featured)
  WHERE is_active = true;

-- Index cho deadline (lọc scholarships đang mở)
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline_active
  ON scholarships(deadline)
  WHERE is_active = true;

-- Index cho full-text search trên title (nếu cần sau này)
-- CREATE INDEX IF NOT EXISTS idx_scholarships_title_gin
--   ON scholarships USING gin(to_tsvector('english', title));

-- Index cho profiles.user_id (FK lookup)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON profiles(user_id);

-- Index cho documents.user_id (danh sách document của user)
CREATE INDEX IF NOT EXISTS idx_documents_user_id
  ON documents(user_id);

-- Check indexes đã tạo
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN (
--   'applications', 'saved', 'scholarships', 'profiles', 'documents'
-- );
