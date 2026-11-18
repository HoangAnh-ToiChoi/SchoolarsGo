# Scripts

Các script dùng cho development, seeding và debugging. Chạy với `node scripts/<file>`.

## Seeding Data

| Script | Mô tả |
|--------|--------|
| `seedAdmin.js` | Tạo tài khoản admin mặc định |
| `seedTestUser.js` | Tạo tài khoản test user |

## Cào dữ liệu

| Script | Mô tả |
|--------|--------|

## Notes

- Tất cả scripts dùng `dotenv` để load `.env`
- Scripts trong thư mục này chỉ chạy local, không chạy trên production

## Dọn dữ liệu cũ

| Script | Mô tả |
|---|---|
| `cleanDb.js` | Xoá học bổng, user thường, profile, tài liệu, đơn, đã lưu, chat. **Giữ tài khoản admin.** Mặc định chỉ đếm, thêm `--yes` mới xoá. |
| `cleanDb.sql` | Cùng nội dung ở dạng SQL, dán vào Supabase SQL Editor nếu không muốn chạy script. |

```bash
# Supabase Cloud (copy .env.cloud.example thành .env.cloud, điền mật khẩu DB)
node scripts/cleanDb.js --env=.env.cloud --allow-remote                           # đếm
node scripts/cleanDb.js --env=.env.cloud --allow-remote --confirm=<PG_HOST> --yes # xoá thật

```

Backup trước khi dọn: Supabase Dashboard → Database → Backups.
File đã upload trong bucket `documents` của Storage **không** bị xoá bởi SQL, cần xoá tay trong Dashboard.

## Cấu hình

Dự án chạy theo **Supabase Cloud** (không dùng Docker nữa):

| Thứ | Vai trò |
|---|---|
| `backend/.env` | Cấu hình chính (Supabase URL, key, `PG_*`) |
| `backend/.env.cloud` | Cấu hình riêng cho script chạy tay (tự tạo từ `.env.cloud.example`, không commit) |

Tạo bảng: chạy `database.sql` và `databaseChatMessages.sql` trong Supabase SQL Editor, sau đó `node scripts/seedAdmin.js`.

## Kéo học bổng từ nguồn bên ngoài

| Script | Mô tả |
|---|---|
| `ingest.js` | Kéo học bổng từ 5 nguồn (module `src/ingestion`). Chi tiết: `docs/scholarshipIngestion/architecture.md`. Dùng `--dry-run` để chạy thử |
| `applyMigration.js` | Chạy một file trong `scripts/migrations/` (ví dụ `--file=003_ingestion.sql`) |
