-- Migration 010: phát tín hiệu Supabase Realtime (Broadcast) khi có thông báo mới / học bổng mới
--   Chuông và trang chủ cập nhật ngay, không phải chờ lần tự làm mới 5 phút.
-- (007 để trống cho cột users ở đợt 1; 009 là index tìm kiếm.)
-- Chạy được nhiều lần (idempotent). Áp dụng bằng: node scripts/applyMigration.js --file=010_realtimeSignals.sql
-- hoặc dán vào Supabase SQL Editor.
--
-- Bảo mật: FE dùng JWT riêng (không phải Supabase Auth) nên RLS theo auth.uid() không bảo vệ được kênh realtime.
-- Vì vậy tín hiệu KHÔNG mang dữ liệu: chỉ báo "có thay đổi", FE gọi lại API (backend kiểm quyền như cũ).
-- Kênh thông báo của mỗi người dùng có tên ngẫu nhiên (users.realtime_topic) để người khác không đoán được.
-- Gửi tín hiệu lỗi (dự án chưa bật Realtime…) chỉ cảnh báo, không bao giờ làm hỏng câu INSERT.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS realtime_topic UUID NOT NULL DEFAULT gen_random_uuid();

-- Học bổng mới đang mở → kênh công khai "scholarships", một tín hiệu cho cả câu INSERT (ingestion chèn 100 dòng / câu)
CREATE OR REPLACE FUNCTION signal_scholarships_inserted() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT count(*) INTO active_count FROM inserted_rows WHERE is_active;
  IF active_count > 0 THEN
    BEGIN
      PERFORM realtime.send(jsonb_build_object('count', active_count), 'inserted', 'scholarships', false);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'signal_scholarships_inserted: %', SQLERRM;
    END;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_signal_scholarships_inserted ON scholarships;
CREATE TRIGGER trg_signal_scholarships_inserted
  AFTER INSERT ON scholarships
  REFERENCING NEW TABLE AS inserted_rows
  FOR EACH STATEMENT EXECUTE FUNCTION signal_scholarships_inserted();

-- Thông báo mới → kênh riêng của từng người có thông báo (dòng bị ON CONFLICT DO NOTHING bỏ qua không tính)
CREATE OR REPLACE FUNCTION signal_notifications_inserted() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  topic TEXT;
BEGIN
  FOR topic IN
    SELECT DISTINCT 'user:' || u.realtime_topic
    FROM inserted_rows n
    JOIN users u ON u.id = n.user_id
  LOOP
    BEGIN
      PERFORM realtime.send('{}'::jsonb, 'notification', topic, false);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'signal_notifications_inserted: %', SQLERRM;
    END;
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_signal_notifications_inserted ON notifications;
CREATE TRIGGER trg_signal_notifications_inserted
  AFTER INSERT ON notifications
  REFERENCING NEW TABLE AS inserted_rows
  FOR EACH STATEMENT EXECUTE FUNCTION signal_notifications_inserted();

COMMIT;
