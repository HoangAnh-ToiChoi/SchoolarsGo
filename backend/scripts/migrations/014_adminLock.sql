-- ============================================================
-- SCHOLARSGO — 014: học bổng admin đã sửa / ẩn thì lượt kéo tự động không đụng tới (R08)
-- ============================================================
-- Trước đây cron kéo học bổng làm mới is_active, summary, deadline theo link bài: học bổng admin đã ẩn
-- (xóa mềm) hiện lại, chỗ admin sửa tay bị ghi đè. admin_locked_at do admin.model đặt khi sửa hoặc ẩn;
-- ingestion/save.js bỏ qua mọi dòng có cột này. Chạy lại nhiều lần không lỗi.

ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS admin_locked_at TIMESTAMPTZ;

-- Dòng đang tắt mà chưa quá hạn (hoặc không có hạn) chỉ có thể do admin ẩn: khóa luôn.
-- Dòng admin đã sửa nội dung trước migration này không phân biệt được với dòng do cron làm mới.
UPDATE scholarships
SET admin_locked_at = now()
WHERE admin_locked_at IS NULL
  AND is_active = false
  AND (deadline IS NULL OR deadline >= now());
