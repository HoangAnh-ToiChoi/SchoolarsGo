-- ============================================================
-- SCHOLARSGO — 014: học bổng admin đã sửa / ẩn thì lượt kéo tự động không đụng tới (R08)
-- ============================================================
-- Trước đây cron kéo học bổng làm mới is_active, summary, deadline theo link bài: học bổng admin đã ẩn
-- (xóa mềm) hiện lại, chỗ admin sửa tay bị ghi đè. admin_locked_at do admin.model đặt khi sửa hoặc ẩn;
-- ingestion/save.js bỏ qua mọi dòng có cột này. Chạy lại nhiều lần không lỗi.

ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS admin_locked_at TIMESTAMPTZ;

-- Khóa dòng admin đã ẩn trước migration này. Dòng đang tắt là do admin ẩn hoặc do cron tắt khi quá hạn:
--   - chưa quá hạn / không có hạn: chỉ có thể do admin ẩn;
--   - đã quá hạn nhưng tắt TRƯỚC hạn nộp (updated_at < deadline): admin ẩn khi còn hạn (admin chỉ ẩn được dòng đang
--     bật), cron chỉ tắt sau hạn. Không khóa thì bài gốc đăng lại hoặc kỳ năm sau sẽ bật lại học bổng lừa đảo đã ẩn.
-- Dòng cron tắt sau hạn để mở: kỳ năm sau vẫn làm mới được (R09). Dòng admin sửa nội dung trước 014 không nhận ra được.
UPDATE scholarships
SET admin_locked_at = now()
WHERE admin_locked_at IS NULL
  AND is_active = false
  AND (deadline IS NULL OR deadline >= now() OR updated_at < deadline);
