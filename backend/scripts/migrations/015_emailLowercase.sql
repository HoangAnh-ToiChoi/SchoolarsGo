-- ============================================================
-- SCHOLARSGO — 015: email người dùng không phân biệt chữ hoa / thường (R16)
-- ============================================================
-- Trước đây "An@Mail.com" và "an@mail.com" đăng ký được hai tài khoản. Backend giờ đổi email đầu vào
-- về chữ thường (validations/auth.validation.js), nên email cũ có chữ hoa phải đổi theo, nếu không
-- chủ tài khoản đó không đăng nhập được. Chạy lại nhiều lần không lỗi.

-- Đổi về chữ thường những email không trùng (không kể chữ hoa) với tài khoản nào khác.
-- Cả nhóm trùng giữ nguyên, kể cả khi mọi email trong nhóm đều có chữ hoa: đổi một cái sẽ đụng khóa unique,
-- còn chọn giữ tài khoản nào là quyết định của người gộp tay.
UPDATE users AS u
SET email = lower(u.email)
WHERE u.email <> lower(u.email)
  AND NOT EXISTS (SELECT 1 FROM users AS other WHERE lower(other.email) = lower(u.email) AND other.id <> u.id);

-- Chặn ở DB: chỉ tạo được khi không còn cặp trùng. Còn trùng thì migration vẫn được ghi là đã áp (không chặn
-- các migration sau) nhưng báo WARNING: gộp tay các cặp trùng
-- (SELECT lower(email), count(*) FROM users GROUP BY 1 HAVING count(*) > 1) rồi tự chạy câu CREATE UNIQUE INDEX bên dưới.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users GROUP BY lower(email) HAVING count(*) > 1) THEN
    RAISE WARNING '015: còn email trùng khi bỏ qua chữ hoa, chưa tạo uq_users_email_lower';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email));
  END IF;
END $$;
