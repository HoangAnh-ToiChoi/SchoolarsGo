# Scripts

Các script dùng cho development, seeding và debugging. Chạy với `node scripts/<file>`.

## Seeding Data

| Script | Mô tả |
|--------|--------|
| `seedScholarships.js` | Seed scholarship data từ nguồn cấu hình sẵn. Options: `--mock` (fake data), `--scrape-only` (scrape trước khi seed) |
| `seedAdmin.js` | Tạo tài khoản admin mặc định |
| `seedTestUser.js` | Tạo tài khoản test user |
| `seedCloud.js` | Seed từ cloud/RSS sources. Options: `--dry-run` (xem trước), `--limit=20` (giới hạn số lượng) |

## Cào dữ liệu

| Script | Mô tả |
|--------|--------|
| `scrapeMulti.js` | Cào học bổng từ nhiều nguồn (cũng chạy định kỳ qua `src/jobs/scholarshipScraper.js`). Options: `--dry-run`, `--limit=100` |

## Notes

- Tất cả scripts dùng `dotenv` để load `.env`
- Scripts trong thư mục này chỉ chạy local, không chạy trên production
