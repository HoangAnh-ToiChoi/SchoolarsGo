# ============================================================
# SCHOLARSGO — AI LONG-TERM MEMORY
# ============================================================
| # | File | Mô tả | Last Updated |
|---|------|-------|--------------|
| 1 | MEMORY.md | INDEX — file này | 31/3/2026 |
| 2 | [MEMORY-schema.md](./MEMORY-schema.md) | Database schema toàn bộ tables | 26/3/2026 |
| 3 | [MEMORY-api.md](./MEMORY-api.md) | API contracts tất cả endpoints | 26/3/2026 |
| 4 | [MEMORY-features.md](./MEMORY-features.md) | Luồng nghiệp vụ, data flow, thuật toán | 31/3/2026 |
| 5 | [MEMORY-devlog.md](./MEMORY-devlog.md) | Bug đã fix, quyết định kỹ thuật, tech debt | 31/3/2026 |

---

## Project Overview

| Field | Value |
|-------|-------|
| Tên dự án | ScholarsGo |
| Mô tả | Scholarship search & study-abroad profile management platform for Vietnamese students |
| Tech Stack | React.js + TailwindCSS (FE) / Node.js + Express (BE) / PostgreSQL + Supabase (DB) |
| Team | Ngáo (FE), Ngơ (BE), Điên (PM/Fullstack) |
| Ngày khởi tạo | 26/3/2026 |
| Deadline P0 | 6/5/2026 |

---

## Core Features P0

| # | Feature | Status | Ghi chú |
|---|---------|--------|---------|
| 1 | Scholarship Search | Chưa bắt đầu | Filter theo quốc gia, ngành, GPA, ngôn ngữ, deadline |
| 2 | Profile Manager | Chưa bắt đầu | Upload & quản lý CV, SOP, bảng điểm, thư giới thiệu |
| 3 | Application Tracker | Chưa bắt đầu | Checklist, deadline tracker, trạng thái đơn ứng tuyển |

## Optional Features P1

| # | Feature | Status | Ghi chú |
|---|---------|--------|---------|
| 4 | AI Recommender | Chưa bắt đầu | Gợi ý học bổng theo profile (OpenAI/Gemini API) |

---

## Git Branch Strategy

```
main      ← production-ready (KHÔNG commit thẳng vào)
develop   ← integration branch
feature/  ← feature mới
fix/      ← bug fix
docs/     ← cập nhật tài liệu
```

---

## Current Sprint

**Sprint 1: Project Setup** (26/3/2026 - 30/3/2026)
- [x] Tạo cấu trúc thư mục project
- [ ] Setup backend scaffolding
- [ ] Setup frontend scaffolding
- [ ] Cấu hình Supabase schema (draft)
- [ ] Viết spec cho Scholarship Search

---

## Notes

- Mỗi khi mở chat mới: đọc file này trước, sau đó đọc file MEMORY liên quan đến task.
- Sau khi xong task: cập nhật status feature ở bảng trên.
- Khi file MEMORY lớn hơn 300 dòng: tách sang archive file.
