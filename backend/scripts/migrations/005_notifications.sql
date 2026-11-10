-- Migration 005: bảng thông báo cho chuông trên header
--   type 'deadline'  : nhắc hạn nộp ở các mốc 14 / 7 / 1 ngày (học bổng đã lưu hoặc đơn còn nháp)
--   type 'new_match' : để dành cho giai đoạn 3 (học bổng mới phù hợp hồ sơ)
-- Chạy được nhiều lần (idempotent). Áp dụng bằng: node scripts/applyMigration.js --file=005_notifications.sql
-- hoặc dán vào Supabase SQL Editor.

BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           VARCHAR(20) NOT NULL CHECK (type IN ('deadline', 'new_match')),
  scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  -- Có khi nhắc theo đơn nháp: bấm thông báo mở trang chi tiết đơn thay vì trang học bổng
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  -- Mốc nhắc (14, 7, 1). 0 cho loại không theo mốc.
  milestone      SMALLINT NOT NULL DEFAULT 0,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Mỗi học bổng chỉ nhắc một lần ở mỗi mốc: job chạy lại nhiều lần cũng không tạo trùng
  CONSTRAINT notifications_once_per_milestone UNIQUE (user_id, type, scholarship_id, milestone)
);

-- Danh sách chuông: lấy theo người dùng, mới nhất trước
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
-- Đếm chưa đọc
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id) WHERE read_at IS NULL;

-- Giống các bảng khác: bật RLS, chỉ chủ sở hữu đọc/sửa được (backend dùng service role nên không bị chặn)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (auth.uid() = user_id);

COMMIT;
