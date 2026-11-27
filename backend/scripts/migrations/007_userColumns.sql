-- ============================================================
-- SCHOLARSGO — 007: cột phân quyền và trạng thái của users
-- ============================================================
-- Code (auth, admin) đã dùng role / is_active / last_login_at từ lâu nhưng repo chưa có SQL tạo cột:
-- production được thêm tay, DB dựng từ repo thì đăng ký lỗi. Số 007 để trống từ trước cho việc này.
-- Chạy lại nhiều lần không lỗi. DB đã có cột (production) thì chỉ thêm ràng buộc và index còn thiếu.

ALTER TABLE users ADD COLUMN IF NOT EXISTS role          VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active     BOOLEAN     NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ NULL;

-- Giá trị hợp lệ khớp ADMIN_VALID_ROLES (backend/src/constants/admin.js).
-- NOT VALID: không quét lại dữ liệu cũ của production, chỉ chặn dòng ghi mới; chạy VALIDATE sau khi đã kiểm dữ liệu.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_valid') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_valid CHECK (role IN ('user', 'admin')) NOT VALID;
  END IF;
END $$;

-- Trang admin lọc người dùng theo vai trò và trạng thái
CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
