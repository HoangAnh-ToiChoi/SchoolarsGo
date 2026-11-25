-- Migration 011: khóa RLS — bỏ mọi policy giả, bật RLS cho mọi bảng, thu quyền của anon / authenticated
-- (009 index tìm kiếm, 010 tín hiệu realtime: hai PR riêng.)
-- Chạy được nhiều lần (idempotent). Áp dụng bằng: node scripts/applyMigration.js --file=011_rlsLockdown.sql
-- hoặc dán vào Supabase SQL Editor.
--
-- Vì sao: app dùng auth tự viết (bảng users + JWT riêng), KHÔNG dùng Supabase Auth.
--   • Mọi policy theo auth.uid() vô nghĩa (auth.uid() luôn NULL với JWT của app).
--   • scholarships_admin_insert / _update dùng WITH CHECK (true) / USING (true): ai có khóa anon
--     (công khai) cũng thêm / sửa được học bổng qua PostgREST, ví dụ đổi link nộp đơn sang trang lừa đảo.
--   • ingestion_runs chưa bật RLS.
-- Backend không bị ảnh hưởng: supabase-js dùng service role (bỏ qua RLS), pool pg đăng nhập bằng chủ bảng
-- (RLS không áp cho chủ bảng khi không FORCE). Supabase chỉ còn là nơi chạy Postgres; quyền do backend kiểm.
-- Realtime (migration 010) dùng Broadcast qua realtime.send(), không đọc bảng public, nên vẫn chạy.
--
-- Bảng mới về sau: nhớ ENABLE ROW LEVEL SECURITY và không tạo policy (test tests/integration/rlsLockdown.test.js bắt lỗi này).

BEGIN;

-- 1. Bỏ mọi policy trong schema public
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END;
$$;

-- 2. Bật RLS cho mọi bảng: không có policy nghĩa là anon / authenticated không đọc, ghi được dòng nào
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END;
$$;

-- 3. Hai lớp: thu luôn quyền bảng của anon / authenticated, kể cả bảng tạo sau này bởi postgres.
--    Lỡ ai đó thêm policy rộng ở bước sau thì PostgREST vẫn báo permission denied.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- 4. Function: mặc định PUBLIC được EXECUTE nên anon gọi được /rest/v1/rpc/<hàm> (vd. scholarship_slugify),
--    và hàm SECURITY DEFINER sẽ chạy bằng quyền chủ hàm. service_role được cấp EXECUTE riêng nên trigger
--    (tạo slug, updated_at, tín hiệu realtime) vẫn chạy khi backend ghi.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- 5. Đối tượng do supabase_admin tạo (extension, tính năng dashboard) theo default privileges riêng của Supabase.
--    Role postgres thường KHÔNG đủ quyền đổi chúng: thử, không được thì chỉ báo NOTICE (không làm hỏng migration).
--    Bảng mới vẫn được test tests/integration/rlsLockdown.test.js bắt (lấy danh sách bảng từ pg_class).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    BEGIN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Không đủ quyền đổi default privileges của supabase_admin: bảng do supabase_admin tạo phải tự bật RLS';
    END;
  END IF;
END;
$$;

COMMIT;
