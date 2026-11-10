# Roadmap ScholarsGo

Cập nhật: 10/11/2026. Nhóm 3 vai trò: FE, BE, AI.

## Hai tính năng đã báo với thầy

1. **AI gợi ý học bổng phù hợp với hồ sơ sinh viên** — mô hình 2 bước:
   - Bước 1: **lọc** học bổng sinh viên đủ điều kiện (luật, không AI).
   - Bước 2: **xếp hạng** độ phù hợp bằng vector (TF-IDF / embedding, cosine / Euclid).
2. **Thông báo thông minh** — báo học bổng mới phù hợp (đủ điều kiện + độ tương đồng ≥ ngưỡng) và nhắc hạn nộp.

Đọc CV và trích yêu cầu học bổng là **dữ liệu đầu vào của tính năng 1** ("trích xuất đặc trưng hồ sơ / học bổng"), không phải tính năng riêng, không gọi là pipeline.

## Giai đoạn 0 — Việc đang dở

| FE | BE | AI |
|---|---|---|
| Trang chi tiết học bổng theo **mẫu B**: khối chưa có dữ liệu thì ẩn; chừa chỗ cho khối điều kiện và nhắc hạn | Chạy migration slug (`004_scholarshipSlug.sql`) trên Supabase | Chốt hướng: TF-IDF và embedding đa ngôn ngữ, dịch vụ Python (FastAPI) riêng |
| Merge `feat/scholarshipDetail` vào `dev`, cập nhật GitHub Pages | Sửa lỗi lưu học bổng: `id` bản ghi đã lưu bị ghi đè bằng `id` học bổng | Ghi vào báo cáo tuần: mô hình 2 bước, kế hoạch thí nghiệm |

## Giai đoạn 1 — Bài toán dữ liệu

| FE | BE | AI |
|---|---|---|
| Trang hồ sơ thêm trường: kinh nghiệm, chứng chỉ (loại + điểm), bằng cấp, quốc tịch, năm sinh | Thêm cột hồ sơ sinh viên; thêm cột yêu cầu học bổng (GPA, chứng chỉ, kinh nghiệm, quốc tịch, tuổi, bậc học, **ngành**) | Prompt trích yêu cầu từ bài đăng học bổng |
| Upload CV và **form xác nhận/sửa** kết quả trích | Nhận CV, lấy chữ (`pdf-parse`, `mammoth`), bỏ thông tin liên hệ, gọi Gemini, chỉ lưu các trường đã trích | Prompt + định dạng JSON trích từ CV, kiểm tra độ chính xác |
| — | Mở rộng module thu thập: điền `eligibility`, `requirements`, `benefits`, `application_url` và yêu cầu có cấu trúc | Quy về **cùng tiêu chí, cùng đơn vị** (GPA thang 4, chứng chỉ có loại và điểm) |

## Giai đoạn 2 — Tính năng 1: AI gợi ý

| FE | BE | AI |
|---|---|---|
| Khối **"Bạn có đủ điều kiện?"** ở trang chi tiết (Đạt / Thiếu / Chưa rõ) | **API xét điều kiện** (bắt buộc): so từng tiêu chí; "Chưa rõ" khác "Thiếu" | **Bộ hồ sơ mẫu có đáp án** (10–20 hồ sơ) |
| Trang "Gợi ý cho bạn" kèm **lý do gợi ý** | Lưu vector bằng `pgvector`; API gợi ý gọi dịch vụ AI | Xử lý **khác ngôn ngữ** (hồ sơ tiếng Việt, học bổng tiếng Anh) |
| "Học bổng tương tự" chuyển sang độ tương đồng vector | Người dùng mới chưa có hồ sơ: hiện học bổng sắp hết hạn / được lưu nhiều | **Thí nghiệm 4 phương án**, đo precision@5: (A) TF-IDF + cosine, (B) TF-IDF + Euclid, (C) embedding + cosine, (D) lọc điều kiện + embedding + cosine |
| Bộ lọc "Chỉ học bổng tôi đủ điều kiện" (tùy chọn) | Tính lại khi có học bổng mới hoặc hồ sơ đổi | Logistic regression / kNN trên bộ mẫu (phần "train"). Lưu ý: vector đã chuẩn hóa thì cosine và Euclid cho cùng thứ tự |

## Giai đoạn 3 — Tính năng 2: Thông báo thông minh

| FE | BE | AI |
|---|---|---|
| ✅ Chuông thông báo trên header, đọc API, đánh dấu đã đọc lưu ở server | ✅ Bảng `notifications`, API `/api/notifications`, job node-cron nhắc hạn 14/7/1 ngày lúc 7:00 (không AI) | **Chọn ngưỡng** tương đồng bằng thí nghiệm |
| Trang cài đặt nhận thông báo | Báo học bổng mới khi đủ điều kiện **và** tương đồng ≥ ngưỡng; trong web + email; không gửi trùng | — |
| Khối nhắc hạn ở trang chi tiết, lịch deadline | API `GET /api/deadlines?from=&to=` | — |

## Giai đoạn 4 — Kiểm thử toàn hệ thống

| FE | BE | AI |
|---|---|---|
| Playwright cả luồng: đăng nhập → upload CV → xác nhận → nhận gợi ý → nhận thông báo | **Cloudflare Tunnel**: `app.` → FE, `api.` → BE, `ai.` → dịch vụ AI (cùng tên miền gốc nên cookie đăng nhập hoạt động) | **Giả lập tấn công**: prompt injection qua CV và bài đăng học bổng, file độc / file scan; đo trước và sau khi thêm biện pháp chặn |
| Thử XSS từ dữ liệu thu thập | Quét bảo mật (OWASP ZAP), giới hạn số lần gọi API, kiểm tra miền giá trị (GPA ≤ 4) | Tổng hợp bảng, biểu đồ kết quả cho báo cáo |

## Song song (FE, khi rảnh)

Làm lại các trang còn dùng `components/legacy`: chi tiết đơn ứng tuyển, dashboard, chat, tin tức, admin. (Đã xong: đã lưu, đơn ứng tuyển, chuông thông báo.)

## Lưu ý chung

- **Dữ liệu cá nhân**: xin phép trước khi đọc CV; bỏ thông tin liên hệ trước khi gửi Gemini; không lưu toàn văn CV.
- **AI có thể sai**: thông tin trích từ CV phải được người dùng xác nhận; kiểm tra miền giá trị.
- Không commit file credentials của Cloudflare Tunnel, `.env`, khóa API.
