-- Dọn dữ liệu cũ: xoá toàn bộ học bổng, user thường, profile, tài liệu, đơn ứng tuyển,
-- học bổng đã lưu và tin nhắn chat. GIỮ LẠI tài khoản admin (users + profiles của admin).
--
-- Chạy trong một transaction: lỗi ở bước nào thì không có gì bị xoá.
-- Dùng được cho cả Postgres local và Supabase Cloud (dán vào SQL Editor).
-- CẦN BACKUP TRƯỚC KHI CHẠY (xem hướng dẫn trong backend/scripts/README.md).

BEGIN;

-- Chặn tay trước: không có admin nào thì dừng, tránh xoá sạch cả bảng users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Không có tài khoản admin nào. Chạy node scripts/seedAdmin.js trước, hoặc bỏ phần xoá users.';
  END IF;
END $$;

-- Xoá theo thứ tự con trước, cha sau
DO $$
BEGIN
  IF to_regclass('public.chat_messages') IS NOT NULL THEN
    DELETE FROM chat_messages;
  END IF;
END $$;

DELETE FROM documents;
DELETE FROM applications;
DELETE FROM saved_scholarships;
DELETE FROM scholarships;

DELETE FROM profiles WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');
DELETE FROM users    WHERE role IS DISTINCT FROM 'admin';

-- Báo kết quả sau khi dọn
SELECT 'users'              AS bang, count(*) AS con_lai FROM users
UNION ALL SELECT 'profiles',           count(*) FROM profiles
UNION ALL SELECT 'scholarships',       count(*) FROM scholarships
UNION ALL SELECT 'applications',       count(*) FROM applications
UNION ALL SELECT 'saved_scholarships', count(*) FROM saved_scholarships
UNION ALL SELECT 'documents',          count(*) FROM documents;

COMMIT;
