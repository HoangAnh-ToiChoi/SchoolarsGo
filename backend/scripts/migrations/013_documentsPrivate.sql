-- ============================================================
-- SCHOLARSGO — 013: tài liệu người dùng lưu ở bucket private
-- ============================================================
-- Trước đây bucket "documents" public: ai có URL là tải được bảng điểm, CV (đường dẫn đoán được theo user_id).
-- Từ đây backend lưu đường dẫn trong bucket (storage_path) và trả link ký có hạn mỗi lần đọc danh sách.
-- Chạy lại nhiều lần không lỗi. Chạy TRƯỚC khi deploy backend mới (code mới đọc cột storage_path).

ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Bản ghi mới không còn URL công khai
ALTER TABLE documents ALTER COLUMN file_url DROP NOT NULL;

-- Bản ghi cũ: lấy đường dẫn từ URL công khai .../storage/v1/object/public/documents/<userId>/<type>/<file>
UPDATE documents
SET storage_path = substring(file_url FROM '/storage/v1/object/public/documents/(.+)$')
WHERE storage_path IS NULL
  AND file_url LIKE '%/storage/v1/object/public/documents/%';

-- Production đã tạo bucket trên Dashboard (public): chuyển sang private. DB dựng từ trống thì tạo luôn
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;
