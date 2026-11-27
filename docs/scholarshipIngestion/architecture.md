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

1. **Module không require gì của phần còn lại của backend.** DB và Gemini được truyền vào qua `createIngestion({ db, aiModel })`. Hai nơi gọi: `src/jobs/scholarshipScraper.js` (server, cron) và `scripts/ingest.js` (chạy tay; GitHub Actions gọi script này cho lượt tăng dần).
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
node scripts/ingest.js --env=.env.cloud --allow-remote --incremental        # chỉ bài mới / vừa sửa từ lượt thành công gần nhất
node scripts/applyMigration.js --file=003_ingestion.sql --env=.env.cloud --allow-remote   # migration
```

Khi server chạy: kéo học bổng **Chủ nhật 2:00**, tắt học bổng quá hạn **mỗi đêm 3:00** (GMT+7), xem `src/jobs/scholarshipScraper.js`.

**Kéo tăng dần mỗi 2 giờ** (`.github/workflows/ingest.yml`, chạy trên GitHub Actions, không phụ thuộc server Railway ngủ hay thức):

- Mốc của mỗi nguồn = `started_at` của lượt **thành công** gần nhất (không lỗi, không chạy thử) trong `ingestion_runs`. Nguồn chưa có lượt nào thì chạy đầy đủ. Lượt lỗi không dời mốc, nên lượt sau lấy bù.
- Gọi WordPress với `orderby=modified` và `modified_after` = mốc lùi 1 ngày (tham số ngày của WordPress tính theo múi giờ của trang). Sau đó lọc chính xác bằng `modified_gmt` và dừng ở bài đầu tiên cũ hơn mốc. Nhờ vậy bài đã xử lý không đi qua Gemini lần nữa, và trang chạy WordPress cũ (bỏ qua `modified_after`) vẫn đúng.
- Bài được sửa (đổi hạn nộp, nội dung) đi qua 7 bước như bài mới; bước 7 làm mới dòng đã có.

**Bước 7 quyết định từng dòng** (`saveRows` trong `save.js`):

| Trường hợp | Làm gì |
|---|---|
| Dòng đã có bị admin sửa hoặc ẩn (`admin_locked_at`, migration 014) | Bỏ qua: không bật lại, không ghi đè hạn nộp / tóm tắt |
| Cùng link bài | Làm mới hạn nộp, điểm, trạng thái, tóm tắt |
| Cùng `dedup_key`, dòng cũ đã quá hạn | Kỳ mới: chuyển dòng cũ sang link, tiêu đề, hạn mới (tiêu đề trùng học bổng khác thì giữ tiêu đề cũ) |
| Cùng `dedup_key`, dòng cũ còn hạn | Bỏ qua (trang khác đã đăng) |
| Chưa có | Thêm mới |

`dedup_key` (`toRow.js`): tiêu đề bỏ dấu, bỏ năm, bỏ đuôi sau ` | ` và đuôi kêu gọi sau ` - ` ("- Apply by …"); đuôi khác sau ` - ` giữ lại (MEXT theo trường ≠ theo đại sứ quán). Tiêu đề chỉ toàn từ chung chung thì khoá là `NULL`, chỉ chống trùng theo link.

Đổi công thức `dedupKey` thì tính lại khoá đã lưu, nếu không lượt kéo sau sẽ thêm bản trùng: `node --import ./register.js scripts/recomputeDedupKeys.js --env=<file env>` (chạy thử, in thay đổi) rồi thêm `--apply` (DB thật thêm `--allow-remote`). Khoá mới đụng khoá dòng khác thì giữ khoá cũ và báo ra.
- `ingestion_runs.started_at` lưu giờ UTC (`toUtcText` trong `save.js`).
- Workflow cần secrets `PG_*` (và tùy chọn `GEMINI_API_KEY`). Chưa có `PG_HOST` thì workflow bỏ qua, không báo lỗi. GitHub chỉ chạy lịch trên nhánh mặc định (`main`).
