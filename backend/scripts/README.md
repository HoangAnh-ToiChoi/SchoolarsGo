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

# Local (Docker), chỉ khi có dùng lại
node scripts/cleanDb.js
node scripts/cleanDb.js --yes
```

Backup trước khi dọn: Supabase Dashboard → Database → Backups.
File đã upload trong bucket `documents` của Storage **không** bị xoá bởi SQL, cần xoá tay trong Dashboard.

## Chuyển hướng giữa Supabase Cloud và Docker

Mặc định dự án chạy theo **Supabase Cloud**. Phần Docker vẫn được giữ làm đường lui, chưa xoá:

| Thứ | Vai trò |
|---|---|
| `docker-compose.yml` (ở gốc repo) | Dựng lại Postgres + Supabase local khi cần |
| `backend/.env` | Cấu hình local (`localhost`) |
| `backend/.env.cloud` | Cấu hình cloud (tự tạo từ `.env.cloud.example`, không commit) |

Quay lại Docker: `docker compose up -d`, rồi chạy `database.sql` và `databaseChatMessages.sql`, sau đó `node scripts/seedAdmin.js`.

## Kéo học bổng từ nguồn bên ngoài

| Script | Mô tả |
|---|---|
| `ingest.js` | Kéo học bổng từ 5 nguồn (module `src/ingestion`). Chi tiết: `docs/scholarshipIngestion/architecture.md`. Dùng `--dry-run` để chạy thử |
| `applyMigration.js` | Chạy một file trong `scripts/migrations/` (ví dụ `--file=003_ingestion.sql`) |
