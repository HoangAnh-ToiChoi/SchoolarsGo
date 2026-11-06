# Scripts

Các script dùng cho development, seeding và debugging. Chạy với `node scripts/<file>`.

## Seeding Data

| Script | Mô tả |
|--------|--------|
| `seedScholarships.js` | Seed scholarship data từ nguồn cấu hình sẵn. Options: `--mock` (fake data), `--scrape-only` (scrape trước khi seed) |
| `seedAdmin.js` | Tạo tài khoản admin mặc định |
| `seedTestUser.js` | Tạo tài khoản test user |
| `seedCloud.js` | Seed từ cloud/RSS sources. Options: `--dry-run` (xem trước), `--limit=20` (giới hạn số lượng) |

## Debugging

| Script | Mô tả |
|--------|--------|
| `debugUpload.js` | Debug Supabase Storage upload - in chi tiết response |
| `checkUsers.js` | Kiểm tra users trên cả Supabase Cloud và Docker Local |
| `queryScholarships.js` | Query và hiển thị scholarship data (theo quốc gia, bậc học, ngôn ngữ) |
| `testStorage.js` | Test Supabase Storage connection và upload |
| `testAdminApi.js` | Integration test cho Admin Module (auth, RBAC, self-lockout) |

## Notes

- Tất cả scripts dùng `dotenv` để load `.env`
- Các script test/debug có thể bỏ nếu không còn cần
- Scripts trong thư mục này chỉ chạy local, không chạy trên production
