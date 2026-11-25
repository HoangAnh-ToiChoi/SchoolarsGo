# Hợp đồng API `/rank` (BE ↔ AI)

Nguồn duy nhất cho định dạng giữa BE và dịch vụ AI xếp hạng. Sửa hợp đồng thì sửa file này và cặp ví dụ JSON trước, rồi mới sửa code. Trạng thái: **đề xuất**, chờ BE, AI, FE chốt.

## Nguyên tắc

- **Có phiên bản.** Đường dẫn `/v1/rank`, response có `version`. Thay đổi phá vỡ thì ra `/v2`, chạy song song.
- **Thêm trường không vỡ.** Bên nhận **bỏ qua trường lạ**. Trường mới luôn tùy chọn.
- **Tên chung.** `items`, `text`, không dùng tên riêng của học bổng, để dùng lại cho thứ khác.
- **AI là hàm thuần.** BE gửi đủ dữ liệu, AI không đọc DB.
- **BE chỉ có một chỗ biết AI:** `services/rankClient.js` (dựng request, timeout, kiểm tra response bằng zod).
- **Riêng tư.** Không gửi tên, email, số điện thoại, `user_id`. Chỉ trường học thuật.

## Request

```
POST /v1/rank
x-internal-key: <khóa nội bộ, lấy từ .env>
x-request-id: <id đi xuyên BE → AI để tra log>
```

```json
{
  "profile": {
    "gpa4": 3.4,
    "degree": "master",
    "field": "computer science",
    "nationality": "VN",
    "birthYear": 2003,
    "certificates": [{ "type": "ielts", "score": 7.0 }],
    "experience": "2 năm làm backend",
    "interests": []
  },
  "items": [
    {
      "id": "uuid",
      "title": "Chevening Scholarship",
      "text": "mô tả học bổng",
      "requirements": { "minGpa4": 3.2, "degrees": ["master"] }
    }
  ],
  "options": { "limit": 20, "explain": true }
}
```

| Trường | Quy ước |
|---|---|
| `profile.gpa4` | GPA đã quy về thang 4 (BE quy đổi trước khi gửi) |
| `profile.degree` | chữ thường: `bachelor`, `master`, `phd` |
| `profile.certificates` | mảng `{ type, score }`, ánh xạ từ cột `profiles.certificates` |
| `items` | tối đa 50 mục mỗi lần gọi, nhiều hơn thì BE tự chia lô |
| `options.explain` | `false` thì AI bỏ `reasons` cho nhẹ (mức 2 chạy lô lớn) |

## Response

```json
{
  "version": "1",
  "model": "tfidf-cosine-2026-11",
  "results": [
    {
      "id": "uuid",
      "score": 0.82,
      "reasons": [
        { "code": "FIELD_MATCH", "params": { "field": "computer science" } },
        { "code": "IELTS_OK", "params": { "need": 6.5, "have": 7.0 } }
      ]
    }
  ],
  "skipped": [{ "id": "uuid", "code": "NO_TEXT" }]
}
```

| Trường | Quy ước |
|---|---|
| `score` | luôn thang **0–1**, mỗi mô hình tự chuẩn hóa về đoạn này để ngưỡng không đổi khi đổi mô hình |
| `results` | đã sắp theo `score` giảm dần |
| `reasons` | **mã + tham số**, không phải câu văn. FE tự dịch và đổi chữ |
| `model` | tên mô hình đã chấm, để tra khi điểm đổi bất thường |
| `skipped` | học bổng AI không chấm được, kèm mã lý do. BE xếp xuống cuối |

### Mã lý do (`reasons[].code`)

Danh sách cố định, cả ba bên cùng giữ. Thêm mã mới thì thêm vào bảng này.

| Mã | Tham số | Ý nghĩa |
|---|---|---|
| `FIELD_MATCH` | `field` | ngành khớp |
| `DEGREE_MATCH` | `degree` | bậc học khớp |
| `IELTS_OK` | `need`, `have` | IELTS đạt yêu cầu |
| `GPA_OK` | `need`, `have` | GPA đạt yêu cầu |
| `NATIONALITY_OK` | `country` | quốc tịch được nhận |
| `TEXT_SIMILAR` | — | nội dung gần hồ sơ |

### Mã bỏ qua (`skipped[].code`)

| Mã | Ý nghĩa |
|---|---|
| `NO_TEXT` | học bổng không có nội dung để chấm |
| `TOO_LONG` | nội dung quá dài |

## Lỗi

```json
{ "error": { "code": "INVALID_REQUEST", "message": "…" } }
```

| HTTP | Ý nghĩa |
|---|---|
| 400 | request sai định dạng |
| 401 | thiếu hoặc sai `x-internal-key` |
| 413 | quá 50 mục |
| 5xx | lỗi phía AI |

## `GET /health`

Trả `{ "ok": true, "model": "…" }`. BE dùng để quyết định có gọi AI hay chuyển sang dự phòng.

## Phía BE

| Việc | Cách làm |
|---|---|
| Cấu hình | `.env`: `RANK_URL`, `RANK_KEY`, `RANK_TIMEOUT_MS=8000`, `RANK_THRESHOLD`, `RANK_ENABLED` |
| Dự phòng | timeout, lỗi, hoặc response sai zod thì dùng cách chấm điểm hiện tại (phương án 0) |
| Tắt khẩn cấp | `RANK_ENABLED=false` tắt AI mà không cần deploy lại |
| Ngưỡng thông báo mức 2 | AI đề xuất con số sau thí nghiệm, BE đặt trong `RANK_THRESHOLD`, không viết cứng |
| Chỗ nối trong code | Từ 24/11/2026 chat và gợi ý **không gọi LLM** (model cũ đã ngừng). Dịch vụ RAG sẽ thay đúng 2 chỗ: `RecommendService.recommend()` (dòng `return top`) và `ChatService.#answer()`; bộ lọc + truy vấn DB giữ nguyên làm dữ liệu neo |

## Cột DB liên quan (migration 008)

| Bảng | Cột | Dùng cho |
|---|---|---|
| `profiles` | `current_degree`, `major`, `nationality`, `birth_year`, `experience`, `certificates` | dựng `profile` |
| `scholarships` | `eligible_nationalities`, `max_age` (cộng với `degree`, `field_of_study`, `min_gpa`, `min_ielts` đã có) | dựng `requirements` và xét điều kiện |

## Kiểm soát thay đổi

- Cặp ví dụ request và response ở trên là **test hợp đồng** dùng chung. BE kiểm tra `rankClient` đọc được ví dụ, AI kiểm tra dịch vụ trả đúng ví dụ.
- AI đưa **bản mock** trả đúng định dạng ngay từ đầu để BE và FE làm song song.

## Việc cần chốt

1. Mô tả học bổng gửi nguyên văn (đề xuất) hay AI tự lấy theo `id`.
2. `reasons` là mã + tham số (đề xuất) hay câu văn viết sẵn.
3. "Học bổng tương tự" dùng chung `/rank` hay thêm route `/v1/similar`.
