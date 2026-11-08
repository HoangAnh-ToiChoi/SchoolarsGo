# Tiêu chí lọc học bổng

Áp dụng cho mọi nguồn trong [sources.md](./sources.md). Mỗi bài đi qua 3 giai đoạn theo thứ tự:
**loại ngay → chấm điểm → chuẩn hoá và chống trùng**.

Mục tiêu: sinh viên Việt Nam mở trang ra chỉ thấy học bổng còn hạn, đúng loại, có thể xin được.

## 1. Loại ngay (không lưu vào database)

Chạy theo hai giai đoạn, chỉ dùng luật chữ (không gọi AI) để tiết kiệm hạn mức Gemini:

- **Giai đoạn 1** (chỉ cần tiêu đề, link, chuyên mục): R5, R6, R1. Chạy trước khi trích xuất thông tin.
- **Giai đoạn 2** (cần hạn nộp và nội dung đã trích xuất): R2, R3, R4.

Mã nguồn: `backend/src/ingestion/shared/filters/hardRules.js`, từ khoá ở `keywords.js`.

| Mã | Điều kiện loại | Cách kiểm tra |
|---|---|---|
| R1 | Không phải học bổng cho sinh viên | (a) Chuyên mục là `jobs`, `internships`, `conferences`, `competitions`, `events`... (b) Tiêu đề chứa `job`, `vacancy`, `hiring`, `conference`, `internship`, `contest`... trừ khi tiêu đề cũng có `scholarship`/`fellowship`/`funded`. (c) **Bài hướng dẫn, danh sách**: "How to apply...", "Top 10...", "8 Asian Countries With...". (d) **Tài trợ cho tổ chức/dự án**: `challenge`, `call for proposals`, `research grant`, `fund for`, `grants for NGOs/startups...`. Nhóm (c) và (d) không có ngoại lệ "scholarship" |
| R2 | Đã hết hạn | Hạn nộp nhỏ hơn ngày hiện tại |
| R3 | Bài cũ, không rõ hạn | Không có hạn nộp và bài đăng cách đây hơn 12 tháng |
| R4 | Loại trừ người Việt | Nội dung nêu chỉ dành cho khu vực khác: `Africans only`, `EU/EEA citizens`, `US citizens`, `UK residents`, `Commonwealth citizens only` |
| R5 | Thiếu link bài | Không có `link` dạng `https://...` hợp lệ |
| R6 | Rác, quảng cáo | Tiêu đề ngắn hơn 10 ký tự, hoặc chứa từ cờ bạc, quảng cáo |

Danh sách từ khoá của R1, R4, R6 để thành hằng số trong một file riêng, sửa không cần đụng logic.

## 2. Chấm điểm (không loại, chỉ xếp thứ tự hiển thị)

| Tiêu chí | Điểm |
|---|---|
| Nhắc rõ `Vietnam` | +35 |
| Nhắc `ASEAN` hoặc `Southeast Asia` | +20 |
| Nhắc `Asia`, `Asian`, `developing countries` | +10 |
| Mở cho `all nationalities`, `international students` | +5 |
| Còn hạn trên 30 ngày | +10 |
| Biết rõ cả nước đến học và bậc học | +10 |
| Không rõ hạn | −10 |
| Chuyên mục chỉ gồm vùng khác (không có Việt Nam, ĐNÁ, châu Á) | −20 |

Tối đa lý thuyết 90 nên điểm không chạm trần. Bài nhắc đích danh Việt Nam + Đông Nam Á + còn hạn + đủ thông tin ≈ 85;
bài chung chung cho sinh viên quốc tế ≈ 15–30. Trọng số nằm ở `SCORE` trong `shared/filters/keywords.js`.

Học bổng "mở cho mọi quốc tịch" được giữ lại nhưng điểm thấp (quyết định ngày 2026-11-08).

## 3. Chuẩn hoá và chống trùng

| Việc | Quy tắc |
|---|---|
| Hạn nộp không rõ | Lưu `null` (cột `deadline` cho phép NULL từ migration 003). Giao diện hiện "Chưa rõ hạn nộp". **Không dùng ngày giả 2099-01-01.** API vẫn trả học bổng chưa rõ hạn |
| Cách tìm hạn nộp | Lấy ngày đứng ngay sau từ khoá `deadline`, `apply by`, `applications close`... Nhiều ngày thì chọn ngày gần nhất còn hạn; chỉ có tháng-năm thì lấy cuối tháng |
| Nước đến học | Thứ tự tin cậy: nhãn trong bài (`Study in:`, `Host Country:`, `Location of the Opportunity`) → tên nước trong tiêu đề → gợi ý từ chuyên mục (chỉ slug dạng `uk-scholarships`). Không tìm ra thì ghi `International`. Lý do: chuyên mục của một số nguồn là vùng đủ điều kiện, không phải nước đến học |
| Làm sạch tiêu đề | Bỏ đuôi `\| Fully Funded`, `\| Study in ...`, `\| Step-by-Step ...` |
| Bậc học | Chỉ `Bachelor`, `Master`, `PhD`, `Any`. Giá trị lạ thì thành `Any` |
| GPA | Số từ 0 đến 4, ngoài khoảng thì `null` |
| IELTS | Số từ 0 đến 9, ngoài khoảng thì `null` |
| Khoá chống trùng | Tiêu đề đã chuẩn hoá: chữ thường, bỏ năm (`2027`, `2027/2028`), bỏ từ `scholarship(s)`, `program(me)`, bỏ ký tự đặc biệt |
| Trùng giữa các nguồn | Giữ bản của nguồn có ưu tiên cao hơn (xem sources.md) |
| Trùng link | Cùng `source_url` thì coi là một bản ghi |
| Quá hạn | Mỗi đêm đặt `is_active = false`, không xoá |

## 4. Trường dữ liệu mới

| Cột | Ý nghĩa |
|---|---|
| `source_url` | Link bài đăng gốc, hiện trên giao diện ("Xem bài đăng gốc"). Khác `application_url` (link nộp đơn) |
| `source` | Tên nguồn, ví dụ `scholars4dev` |
| `relevance_score` | Điểm ở mục 2 (0–100). API sắp theo cột này giảm dần, rồi theo hạn nộp |
| `summary` | Đoạn giới thiệu ngắn lấy từ bài đăng, hiện ở mục "Giới thiệu" của trang chi tiết |
| `dedup_key`, `source_priority`, `published_at` | Phục vụ chống trùng và tính độ mới |

Bảng `ingestion_runs` ghi mỗi lượt kéo: số bài lấy về, số bài bị loại theo từng luật, số bài thêm / bỏ qua.

## 5. Quyết định đã chốt

| Ngày | Quyết định |
|---|---|
| 2026-11-08 | Giữ học bổng mở cho mọi quốc tịch, chấm điểm thấp |
| 2026-11-08 | Nhận học bổng chưa rõ hạn nếu bài đăng trong 12 tháng gần nhất |
| 2026-11-08 | Nguồn thứ 5 là scholarshiproar; DAAD làm sau cùng |

## 6. Kết quả lượt kéo đầu tiên (2026-11-08)

| Nguồn | Lấy về | Đạt | Ghi chú |
|---|---|---|---|
| scholars4dev | 74 | 26 | 45 bài hết hạn (R2) |
| scholarshipsCorner | 32 | 15 | |
| opportunitiesForYouth | 137 | 40 | Nhiều bài việc làm, hội nghị bị loại (R1) |
| scholarshipRegion | 22 | 7 | |
| scholarshipRoar | 38 | 31 | |
| **Tổng** | | **119** | 61 bài chưa rõ hạn nộp |

## 7. Việc cần theo dõi

- Phân bố điểm sau khi giảm trọng số (119 bài): 80–100: 1 · 60–79: 16 · 40–59: 38 · 20–39: 48 · 0–19: 16.
- Một nửa học bổng chưa rõ hạn nộp vì bài đăng không ghi ngày theo mẫu thông thường. Gemini được thiết kế để điền bớt: tự bật khi có `GEMINI_API_KEY` trong `backend/.env`.
- Chạy `--dry-run --verbose` định kỳ và đọc tay vài chục bài để kiểm tra R4 (loại nhầm hay sót).
