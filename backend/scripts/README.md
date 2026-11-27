# Scripts

Các script dùng cho development, seeding và debugging. Chạy với `node scripts/<file>`.

## Seeding Data

| Script | Mô tả |
|--------|--------|
| `seedAdmin.js` | Tạo admin (hoặc nâng quyền tài khoản có sẵn) từ `ADMIN_EMAIL` + `ADMIN_PASSWORD` (≥ 12 ký tự); DB ngoài localhost cần `--allow-remote` |
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

Tạo bảng: `npm run migrate` (DB local) hoặc `npm run migrate -- --env=.env.cloud --allow-remote` (Supabase Cloud), sau đó `ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/seedAdmin.js --env=<file env>` (thêm `--allow-remote` cho DB thật). Script chạy `migrations/000_baseline.sql` → mới nhất, bỏ qua file đã ghi trong bảng `schema_migrations`.

## Kéo học bổng từ nguồn bên ngoài

| Script | Mô tả |
|---|---|
| `ingest.js` | Kéo học bổng từ 5 nguồn (module `src/ingestion`). Chi tiết: `docs/scholarshipIngestion/architecture.md`. Dùng `--dry-run` để chạy thử |
| `migrate.js` (`npm run migrate`) | Chạy mọi migration chưa áp theo thứ tự, ghi vào `schema_migrations`. `--dry-run` chỉ liệt kê, không ghi gì vào DB |
| `applyMigration.js` | Chạy một file trong `scripts/migrations/` (ví dụ `--file=003_ingestion.sql`), không ghi `schema_migrations` |
