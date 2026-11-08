# Kiến trúc module kéo học bổng

Mã nguồn: `backend/src/ingestion/`. Tiêu chí lọc xem [filterCriteria.md](./filterCriteria.md), nguồn xem [sources.md](./sources.md).

## Luồng chạy

```
sources/<tênNguồn>  →  RawPost  →  luật R5,R6,R1  →  trích xuất  →  luật R2,R3,R4  →  chấm điểm  →  chuẩn hoá  →  writer  →  DB
(mỗi nguồn 1 folder)               (shared/filters)  (shared/extract)  (shared/filters)  (scorer)    (shared/normalize)  (shared)
```

`ingestionService.js` là nhạc trưởng: gọi từng nguồn theo thứ tự ưu tiên và cho mọi bài đi qua cùng một đường.
Các nguồn không biết đến nhạc trưởng, và chỉ nhạc trưởng gọi bộ lọc.

## Cấu trúc

```
src/ingestion/
├── index.js                  cửa vào: createIngestion({ db, logger, aiModel, fetchImpl, now })
├── ingestionService.js       nhạc trưởng
├── types.js                  kiểu dữ liệu (JSDoc): RawPost, Facts, Source, IngestionStore
├── sources/
│   ├── index.js              sổ đăng ký nguồn (tắt/bật/thêm nguồn ở đây)
│   └── <tênNguồn>/           config.js (URL, chuyên mục, ưu tiên) · mapper.js (đổi dữ liệu thô) · index.js
├── shared/
│   ├── wordpressClient.js    gọi /wp-json/wp/v2/posts, tự thử lại khi 429/5xx
│   ├── wordpressMapper.js    bài WordPress → RawPost, suy gợi ý từ chuyên mục
│   ├── createWordPressSource.js  ghép config + mapper thành một Source
│   ├── filters/              keywords.js · hardRules.js (R1–R6) · scorer.js
│   ├── extract/              dateParser.js · countries.js · heuristicExtractor.js · geminiExtractor.js (tuỳ chọn)
│   ├── normalize/            normalizer.js · dedupKey.js
│   └── scholarshipWriter.js  quyết định thêm / làm mới / bỏ qua
└── store/ingestion.repository.js   toàn bộ SQL của module
```

## Quy tắc thiết kế (để đợt đổi cấu trúc thư mục sau này an toàn)

1. **Module không import gì từ phần còn lại của backend.** DB, Gemini, logger, `fetch`, đồng hồ đều được truyền vào qua `createIngestion()`. Chuyển folder thì chỉ sửa hai nơi ráp nối: `src/container.js` và `scripts/ingest.js`.
2. **Mỗi nguồn là một folder tách biệt**, trả ra cùng dạng `RawPost`. Một nguồn hỏng không ảnh hưởng nguồn khác (nhạc trưởng bắt lỗi từng nguồn).
3. **Luật lọc là hàm thuần** (nhận dữ liệu, trả đạt/không), không đụng DB hay mạng, nên test được ngay. Từ khoá nằm riêng ở `keywords.js`.
4. **Nguồn chỉ được gợi ý (`signals`), không được tự lọc.** Mọi luật chỉ nằm ở một chỗ.
5. **SQL chỉ nằm trong `store/ingestion.repository.js`**, đúng quy tắc tầng của dự án.
6. **Gemini là tuỳ chọn.** Tự bật khi có `GEMINI_API_KEY` trong `backend/.env`; không có khoá thì chỉ dùng luật chữ. Tắt bằng `INGESTION_USE_AI=false` (server) hoặc `--no-ai` (script). Gemini chỉ điền chỗ trống (nước, bậc học, đơn vị cấp, hạn nộp), không ghi đè thứ luật chữ đã tìm được.

## Thêm một nguồn WordPress mới

1. Sao chép một folder trong `sources/` (ví dụ `scholarshipRoar`), đổi tên theo trang.
2. Sửa `config.js`: `name`, `priority`, `baseUrl`, `queries`.
3. Thêm một dòng `require` vào `sources/index.js`.
4. Chạy `npm run ingest:dry -- --source=<tênNguồn>` rồi đọc tay vài bài.

Nguồn không phải WordPress (ví dụ DAAD) thì viết `index.js` tự lấy dữ liệu, chỉ cần trả `{ name, priority, fetchPosts }` với `fetchPosts` là async generator trả `RawPost`.

## Chạy

```bash
npm run test:ingestion                                                      # test (không cần mạng, không cần DB)
node scripts/ingest.js --env=.env.cloud --allow-remote --dry-run --verbose  # chạy thử, không ghi DB
node scripts/ingest.js --env=.env.cloud --allow-remote                      # kéo thật
node scripts/applyMigration.js --file=003_ingestion.sql --env=.env.cloud --allow-remote   # migration
```

Khi server chạy: kéo học bổng **Chủ nhật 2:00**, tắt học bổng quá hạn **mỗi đêm 3:00** (GMT+7), xem `src/jobs/scholarshipScraper.js`.
