-- ============================================================
-- SCHOLARSGO — 007: cột phân quyền và trạng thái của users
-- ============================================================
-- Code (auth, admin) đã dùng role / is_active / last_login_at từ lâu nhưng repo chưa có SQL tạo cột:
-- production được thêm tay, DB dựng từ repo thì đăng ký lỗi. Số 007 để trống từ trước cho việc này.
-- Chạy lại nhiều lần không lỗi. DB đã có cột (production) thì chỉ thêm ràng buộc và index còn thiếu.

ALTER TABLE users ADD COLUMN IF NOT EXISTS role          VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active     BOOLEAN     NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ NULL;

-- Chưa thêm CHECK (role IN ('user', 'admin')): kể cả NOT VALID, Postgres vẫn kiểm ràng buộc ở MỌI lần UPDATE dòng đó
-- (vd. ghi last_login_at khi đăng nhập), nên một dòng production có role lạ sẽ làm đăng nhập lỗi 500.
-- Thêm ở migration sau, khi đã kiểm `SELECT DISTINCT role FROM users` trên production.

-- Trang admin lọc người dùng theo vai trò và trạng thái
CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
