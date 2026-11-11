# Kiến trúc module kéo học bổng

Mã nguồn: `backend/src/ingestion/`. Tiêu chí lọc xem [filterCriteria.md](./filterCriteria.md), nguồn xem [sources.md](./sources.md).

## Luồng chạy

Đọc `index.js` trước: luồng 7 bước được viết từ trên xuống trong hàm `collectRows`.

```
sources.js ─→ 1 fetchPosts ─→ 2 checkBasic ─→ 3 extractInfo (+ aiFill) ─→ 4 checkDetails ─→ 5 scorePost ─→ 6 toRow ─→ 7 saveRows ─→ DB
              wordpress.js     filter.js       extract.js  aiExtract.js    filter.js         score.js       toRow.js    save.js
              lấy bài          loại rác        tìm hạn, nước, bậc học      loại hết hạn,     chấm 0–100     dòng DB     thêm / làm mới
              (post)           R5 R6 R1        (info)                      R2 R3 R4                         + khoá      / bỏ qua
                                                                                                             chống trùng
```

Bước 2 chạy trước bước 3 để không tốn lượt gọi Gemini cho bài rác. Một trang lỗi (sập, bị chặn) thì ghi lỗi rồi chạy trang tiếp theo.

## Cấu trúc

Mỗi file là một bước, tên file là việc nó làm:

```
src/ingestion/
├── index.js       ĐỌC TRƯỚC — createIngestion() lắp DB + Gemini; runIngestion() chạy 7 bước
├── sources.js     5 trang web và cấu hình (thêm/tắt trang ở đây)
├── wordpress.js   1. gọi API WordPress, thử lại khi 429/5xx, đổi HTML → chữ (post)
├── filter.js      2 + 4. luật loại bài R1–R6 và danh sách từ khoá
├── extract.js     3. tìm hạn nộp, nước, bậc học, đơn vị cấp, GPA, IELTS bằng regex (info)
├── aiExtract.js   3. (tuỳ chọn) Gemini điền chỗ regex không tìm được
├── countries.js   danh sách tên nước và cách viết khác
├── score.js       5. chấm độ phù hợp với sinh viên Việt Nam
├── toRow.js       6. đổi thành dòng bảng scholarships + khoá chống trùng
└── save.js        7. quyết định thêm / làm mới / bỏ qua + toàn bộ SQL
```

Dữ liệu đi qua các bước:

| Tên | Tạo ở | Gồm |
|---|---|---|
| `post` | `wordpress.js` | `sourceName, priority, title, link, publishedAt, excerpt, contentText, categories, signals` |
| `info` | `extract.js` | `deadline, degree, degreeKnown, country, provider, coverage, language, minGpa, minIelts` |
| `row` | `toRow.js` | đúng cột bảng `scholarships` + `dedup_key` |

`signals` là gợi ý suy từ chuyên mục của trang, dạng `region:southeastAsia`, `degree:Master`, `country:Japan`.

## Quy tắc

1. **Module không require gì của phần còn lại của backend.** DB và Gemini được truyền vào qua `createIngestion({ db, aiModel })`. Hai nơi gọi: `src/container.js` (server, cron) và `scripts/ingest.js` (chạy tay).
2. **Luật lọc, trích xuất, chấm điểm là hàm thuần** (nhận dữ liệu, trả kết quả), không đụng DB hay mạng, nên test được ngay.
3. **SQL chỉ nằm trong `save.js`.**
4. **Gemini là tuỳ chọn.** Tự bật khi có `GEMINI_API_KEY`; tắt bằng `INGESTION_USE_AI=false` (server) hoặc `--no-ai` (script). Chỉ điền chỗ trống, không ghi đè thứ regex đã tìm được.

## Thêm một trang WordPress mới

1. Thêm một object vào mảng `SOURCES` trong `sources.js`: `name`, `priority`, `baseUrl`, `queries`.
2. Chạy `npm run ingest:dry -- --source=<tên>` rồi đọc tay vài bài.

## Chạy

```bash
npm run test:ingestion                                                      # test (không cần mạng, không cần DB)
node scripts/ingest.js --env=.env.cloud --allow-remote --dry-run --verbose  # chạy thử, không ghi DB
node scripts/ingest.js --env=.env.cloud --allow-remote                      # kéo thật
node scripts/applyMigration.js --file=003_ingestion.sql --env=.env.cloud --allow-remote   # migration
```

Khi server chạy: kéo học bổng **Chủ nhật 2:00**, tắt học bổng quá hạn **mỗi đêm 3:00** (GMT+7), xem `src/jobs/scholarshipScraper.js`.
