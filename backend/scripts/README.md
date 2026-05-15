# Scripts

Các script dùng cho development, seeding và debugging. Chạy với `node scripts/<file>`.

## Seeding Data

| Script | Mô tả |
|--------|--------|
| `seed-scholarships.js` | Seed scholarship data từ nguồn cấu hình sẵn. Options: `--mock` (fake data), `--scrape-only` (scrape trước khi seed) |
| `seed-admin.js` | Tạo tài khoản admin mặc định |
| `seed-test-user.js` | Tạo tài khoản test user |
| `seed-cloud.js` | Seed từ cloud/RSS sources. Options: `--dry-run` (xem trước), `--limit=20` (giới hạn số lượng) |

## Debugging

| Script | Mô tả |
|--------|--------|
| `debug-upload.js` | Debug Supabase Storage upload - in chi tiết response |
| `check-users.js` | Kiểm tra users trên cả Supabase Cloud và Docker Local |
| `query-scholarships.js` | Query và hiển thị scholarship data (theo quốc gia, bậc học, ngôn ngữ) |
| `test-storage.js` | Test Supabase Storage connection và upload |
| `test-admin-api.js` | Integration test cho Admin Module (auth, RBAC, self-lockout) |

## Notes

- Tất cả scripts dùng `dotenv` để load `.env`
- Các script test/debug có thể bỏ nếu không còn cần
- Scripts trong thư mục này chỉ chạy local, không chạy trên production
