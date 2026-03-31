# ============================================================
# SCHOLARSGO — DEVELOPER LOG
# ============================================================
# Last Updated: 31/3/2026

---

## Changelog

| Date | Version | Type | Description |
|------|---------|------|-------------|
| 26/3/2026 | v0.1 | init | Initial project scaffold, 6 DB tables, 18 API endpoints defined |
| 31/3/2026 | v0.2 | feat | Viết script scrape scholarships từ scholars4dev.com, seed vào Supabase. Thêm axios + cheerio vào package.json. Thêm npm scripts: seed, seed:mock, scrape |

---

## Bug Fixes

*(Chưa có bug nào được fix — project mới khởi tạo)*

---

## Technical Decisions

### 31/3/2026 — Scraping: axios + cheerio thay vì Puppeteer/Playwright

**Vấn đề:** Cần cào dữ liệu scholarships từ scholars4dev.com để seed 500+ records vào DB trước 6/5/2026.

**Lựa chọn:**
- Puppeteer / Playwright → headless browser, parse chính xác, nhưng nặng, chậm, dễ bị detect
- axios + cheerio → HTTP request + HTML parsing, nhẹ, nhanh, đủ cho trang có cấu trúc đơn giản

**Quyết định:** axios + cheerio

**Lý do:**
- Trang scholars4dev có HTML structure đơn giản, có thể parse bằng CSS selector
- Nhẹ hơn nhiều so với headless browser
- Dễ maintain và debug
- Thêm rate limiting (1.2s sleep) để tránh bị chặn IP

**Fallback:** Nếu website thay đổi cấu trúc HTML → cân nhắc chuyển sang Puppeteer.

---

### 26/3/2026 — Database: Supabase thay vì raw PostgreSQL

**Vấn đề:** Team cần real-time, authentication built-in, và storage cho documents.

**Lựa chọn:**
- Raw PostgreSQL → cần tự implement auth, file storage
- Supabase → auth, storage, real-time, RLS all-in-one

**Quyết định:** Dùng Supabase (PostgreSQL underneath)

**Lý do:**
- Speed up development — không cần implement auth từ đầu
- RLS policy đơn giản hóa security
- Built-in storage bucket cho documents
- Free tier đủ cho development và staging

---

### 26/3/2026 — State Management: Zustand thay vì Redux

**Vấn đề:** Cần global state cho user session, UI preferences.

**Lựa chọn:**
- Redux Toolkit → verbose, boilerplate nhiều
- Zustand → minimal boilerplate, TypeScript-friendly (mặc dù project dùng JS)

**Quyết định:** Zustand

**Lý do:**
- Code ngắn hơn, maintainability cao hơn
- Đủ cho use-case của ScholarsGo (session + preferences)
- Team đã quen với Zustand

---

### 26/3/2026 — Validation: Zod thay vì express-validator

**Vấn đề:** Backend cần validate request body.

**Lựa chọn:**
- express-validator → string-based validation
- Zod → schema-based, TypeScript-ready (backported sang JS)

**Quyết định:** Zod

**Lý do:**
- Declarative, self-documenting schemas
- Parse và validate trong 1 step
- Error messages tốt hơn

---

## Tech Debt

| # | Item | Severity | Notes | Tracking |
|---|------|----------|-------|----------|
| 1 | Chưa có unit tests | Medium | Backend + Frontend | — |
| 2 | Chưa có E2E tests | Low | Playwright/Cypress | — |
| 3 | Chưa có CI/CD pipeline | Medium | GitHub Actions | — |
| 4 | Chưa có error tracking (Sentry) | Low | — | — |
| 5 | AI recommender fallback chưa test | Medium | Cần test rule-based fallback | — |

---

## Known Issues

*(Chưa có known issues)*

---

## Future Considerations

- **Redis caching** cho scholarship list (staleTime: 5 phút)
- **Email notifications** khi deadline approaching (SendGrid / Supabase Edge Functions)
- **Multi-language support** (Vietnamese / English) — i18n
- **Mobile app** (React Native) nếu có demand
- **Admin dashboard** cho staff quản lý scholarships

---

## Setup Notes

### Environment Setup (Ngơ)

```
1. Clone repo
2. cp backend/.env.example backend/.env
   → Fill in SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET
3. cd backend && npm install && npm run dev
4. cp frontend/.env.example frontend/.env.local
   → Fill in VITE_API_BASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
5. cd frontend && npm install && npm run dev
```

### Supabase Setup

```
1. Tạo project trên supabase.com
2. Chạy SQL migration trong supabase/migrations/
3. Enable Email auth trong Authentication settings
4. Tạo storage bucket "documents" với public policy
5. Copy URL và keys vào .env
```
