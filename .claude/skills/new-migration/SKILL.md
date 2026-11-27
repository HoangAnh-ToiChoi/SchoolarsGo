---
name: new-migration
description: Tạo migration SQL mới cho Supabase Postgres của ScholarsGo — đánh số tiếp theo, tên camelCase, chạy lại nhiều lần không lỗi, kèm index cho cột lọc. Dùng khi cần thêm bảng/cột/index/hàm SQL hoặc người dùng gõ /new-migration <mô tả>.
argument-hint: "<tênMigration> — mô tả"
---

# Migration mới — ScholarsGo

Chuyển thể từ ECC `database-migrations` + `postgres-patterns`, theo quy ước `backend/scripts/migrations/`.

## 1. Đặt tên
```bash
ls backend/scripts/migrations/
```
Số = lớn nhất hiện có + 1, 3 chữ số (`ls backend/scripts/migrations`; `npm run migrate` báo lỗi nếu trùng số). Tên `00N_tenMigration.sql` camelCase.

**Không sửa migration đã commit** (hook `guardFiles` sẽ hỏi lại): thay đổi tiếp theo luôn là file mới.

## 2. Viết idempotent
- `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`.
- Ràng buộc/kiểu enum: bọc `DO $$ BEGIN … EXCEPTION WHEN duplicate_object THEN NULL; END $$;`.
- Kiểu: `uuid` khóa (theo bảng hiện có), `timestamptz` cho thời gian, `text`, `numeric` cho tiền, `boolean`.
- Khóa ngoại có `ON DELETE` rõ ràng; cột `user_id` của dữ liệu người dùng có index.
- Cột mới dùng để lọc/sắp xếp → index (cân nhắc index ghép: cột bằng trước, khoảng sau).
- Đổi/xóa cột đang dùng → expand–contract: thêm mới → code đọc cả hai → chuyển dữ liệu → bỏ cũ ở migration sau.

## 3. Đồng bộ
- Cập nhật `docs/database.md` (mục bảng liên quan). **Không** sửa `000_baseline.sql`: DB mới dựng bằng `npm run migrate` (000 → mới nhất), nên migration mới là đủ.
- Model chọn cột mới cụ thể (không SELECT *).

## 4. Kiểm tra
Có Supabase local (`docs/lab.md`) → `npm run migrate` hai lần (lần 2 phải "0 migration chưa áp"), rồi `npm run test:integration` (bắt bảng thiếu RLS). Không có → đọc lại toàn file, tự hỏi "chạy lần hai có lỗi không?"; CI job Integration sẽ dựng DB từ trống và chạy lại. Lên DB thật: người dùng chạy `npm run migrate -- --env=.env.cloud --allow-remote` — Claude không chạy lên DB thật khi chưa được yêu cầu.
