# Lộ trình phát triển — xét điều kiện học bổng

Cập nhật: 10/11/2026.

## Vấn đề

Trang chi tiết học bổng muốn trả lời "Bạn có đủ điều kiện không?", nhưng hiện cả hai phía đều thiếu dữ liệu có cấu trúc:

| Phía | Hiện có | Thiếu |
|---|---|---|
| Sinh viên | Hồ sơ tự gõ tay: GPA, trình độ tiếng Anh (chuỗi tự do), ngành, quốc gia, bậc học mục tiêu (`profiles`). CV/SOP chỉ được **lưu file**, không đọc nội dung (`documents`) | Kinh nghiệm làm việc, chứng chỉ cụ thể (IELTS/TOEFL/Duolingo + điểm), bằng cấp đã có, quốc tịch, năm sinh. Không có API đọc CV |
| Học bổng | `min_gpa`, `min_ielts` (phần lớn trống với dữ liệu thu thập), `eligibility`/`requirements`/`benefits` dạng văn bản | Module thu thập **không điền** `eligibility`, `requirements`, `benefits`, `application_url`. Không có yêu cầu dạng có cấu trúc (kinh nghiệm, quốc tịch, tuổi, chứng chỉ) |

Vì vậy mọi tính năng "so khớp" (xét điều kiện, gợi ý AI, thông báo đúng người, checklist hồ sơ) đều đang thiếu nền.

## Thứ tự làm (cái sau dùng kết quả cái trước)

```
1. Mở rộng hồ sơ sinh viên ─┐
2. Đọc CV → điền hồ sơ  ────┼─→ 4. Bộ xét điều kiện ─┬─→ 5. Trang chi tiết: "Bạn có đủ điều kiện?"
3. Trích yêu cầu học bổng ──┘                        ├─→ 6. AI gợi ý (tính năng 1)
                                                     ├─→ 7. Thông báo thông minh (tính năng 2)
                                                     └─→ 8. Checklist hồ sơ tự sinh
```

## Danh sách tính năng

| # | Tính năng | Nội dung | Phía | Cần AI |
|---|---|---|---|---|
| 1 | Mở rộng hồ sơ sinh viên | Thêm trường: số năm kinh nghiệm, chứng chỉ ngoại ngữ (loại + điểm, thay cho `english_level` dạng chuỗi), bằng cấp đã có, quốc tịch, năm sinh. Trang hồ sơ cho nhập các trường này | BE + FE | Không |
| 2 | Đọc CV → điền hồ sơ | Upload CV (PDF/Word) → lấy văn bản (`pdf-parse`, `mammoth`) → Gemini trích JSON (GPA, chứng chỉ, kinh nghiệm, bằng cấp, ngành, kỹ năng) → **người dùng xác nhận/sửa** rồi mới lưu vào hồ sơ | BE + FE | Có |
| 3 | Trích yêu cầu học bổng | Mở rộng module thu thập: trích `eligibility`, `requirements`, `benefits`, `application_url` và yêu cầu có cấu trúc (GPA, chứng chỉ, kinh nghiệm, quốc tịch, tuổi, bậc học) vào bảng/ cột riêng | BE (ingestion) | Có (Gemini, đã có sẵn trong module) |
| 4 | Bộ xét điều kiện | So hồ sơ (1, 2) với yêu cầu (3) bằng luật → mỗi tiêu chí trả **Đạt / Thiếu / Chưa rõ**. Một API dùng chung, VD `GET /api/scholarships/:slug/eligibility` | BE | Không |
| 5 | Trang chi tiết | Khối "Bạn có đủ điều kiện?" dùng kết quả (4); các mục Quyền lợi/Điều kiện/Hồ sơ dùng dữ liệu (3); nút "Nộp đơn trên trang chính thức" khi có `application_url` | FE | Không |
| 6 | AI gợi ý (tính năng 1) | Dùng (4) làm bộ lọc cứng, rồi xếp hạng bằng độ tương đồng vector giữa hồ sơ và học bổng (cosine/Euclid) | BE + AI | Có |
| 7 | Thông báo thông minh (tính năng 2) | Chỉ báo học bổng mới mà người dùng **đủ điều kiện** hoặc gần đủ; nhắc deadline; nhắc tài liệu còn thiếu | BE + FE | Không |
| 8 | Checklist hồ sơ tự sinh | Checklist đơn ứng tuyển lấy từ `requirements` của học bổng (hiện cố định 6 mục), tự đánh dấu mục đã có tài liệu upload | BE + FE | Có (tách danh sách) |
| 9 | Lọc "Chỉ học bổng tôi đủ điều kiện" | Thêm vào bảng bộ lọc trên header, dùng (4) | FE + BE | Không |
| 10 | Góp ý CV/SOP theo học bổng | AI nhận xét CV/SOP so với yêu cầu của một học bổng cụ thể | BE + AI | Có (tùy chọn) |

## Lưu ý chung

- **Dữ liệu cá nhân**: CV có họ tên, điện thoại, email, địa chỉ. Xin phép trước khi đọc CV; lọc thông tin liên hệ trước khi gửi cho Gemini; chỉ lưu các trường đã trích, không lưu toàn văn CV.
- **AI có thể sai**: mọi thông tin AI trích ra (từ CV hay từ bài đăng học bổng) cần đánh dấu nguồn; với hồ sơ sinh viên thì người dùng phải xác nhận.
- **"Chưa rõ" khác "Thiếu"**: học bổng không ghi yêu cầu thì trả "Chưa rõ", không được coi là đạt hay không đạt.

## Việc còn dở khác

- `/notifications`, `/settings/notifications` chưa có trang (bấm vào ra 404).
- API `GET /api/deadlines?from=&to=` cho lịch deadline và job nhắc hạn (tính năng 2).
- Các trang còn dùng `components/legacy`: chi tiết học bổng, đã lưu, đơn ứng tuyển, dashboard, gợi ý, chat, tin tức, admin.
- Chưa có kiểm thử giao diện tự động cho UI mới (bộ e2e cũ đã xóa).
- Lỗi nhỏ `backend/src/repositories/saved.repository.js`: `id` của bản ghi đã lưu bị ghi đè bằng `id` học bổng.
- Migration `004_scholarshipSlug.sql` (nhánh `feat/scholarshipDetail`) chưa chạy trên Supabase.
