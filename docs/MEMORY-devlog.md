# ============================================================
# SCHOLARSGO — DEVELOPER LOG
# ============================================================
# Last Updated: 4/4/2026

---

## Changelog

| Date | Version | Type | Description |
|------|---------|------|-------------|
| 26/3/2026 | v0.1 | init | Initial project scaffold, 6 DB tables, 18 API endpoints defined |
| 31/3/2026 | v0.2 | feat | Viết script scrape scholarships từ scholars4dev.com, seed vào Supabase. Thêm axios + cheerio vào package.json. Thêm npm scripts: seed, seed:mock, scrape |
| 4/4/2026 | v0.3 | feat | Auth API Week 3: register/login/logout/refresh/me. Raw SQL (không Supabase SDK). bcryptjs + jsonwebtoken + express-rate-limit. Validators: password min 6 chars. |
| 4/4/2026 | v0.4 | feat | Scholarships API Week 3: list/detail endpoints. Raw SQL, parameterized queries, dynamic filter builder, pagination (COUNT + LIMIT/OFFSET), `deadline > NOW()` check. File test-api.http. |

---

## Bug Fixes

### 4/4/2026 — scholarship.service.js: getById thiếu điều kiện is_active + deadline
**Vấn đề:** Endpoint `GET /api/scholarships/:id` không kiểm tra `is_active = true` và `deadline > NOW()` → cho phép truy cập học bổng đã hết hạn hoặc bị deactivate.

**Fix:**
```sql
-- TRƯỚC (bug):
SELECT * FROM scholarships WHERE id = $1

-- SAU (fix):
SELECT * FROM scholarships WHERE id = $1 AND is_active = true AND deadline > NOW()
```

### 4/4/2026 — scholarship.service.js: getAll dùng `deadline >= now()` thay vì `> now()`
**Vấn đề:** Học bổng có deadline trùng với thời điểm hiện tại vẫn hiển thị → có thể gây confusion khi deadline hết vào đúng ngày.

**Fix:**
```sql
-- TRƯỚC (bug):
const conditions = ['is_active = true', 'deadline >= now()'];

-- SAU (fix):
const conditions = ['is_active = true', 'deadline > NOW()'];
```

---

## Technical Decisions

### 4/4/2026 — Auth: Raw SQL + bcryptjs + jsonwebtoken (không dùng Supabase SDK)

**Vấn đề:** Yêu cầu Week 3 chỉ định dùng `bcrypt` và `jsonwebtoken` thuần, không dùng `@supabase/supabase-js` cho auth. Các thư viện này đã có trong `package.json` (`bcryptjs` và `jsonwebtoken`).

**Lựa chọn:**
- Supabase Auth (built-in) → dùng `supabase.auth.*` → có sẵn nhưng không match yêu cầu đề bài
- Raw SQL + bcryptjs + jsonwebtoken → chủ động hoàn toàn, parameterized queries chống SQL injection

**Quyết định:** Raw SQL + bcryptjs + jsonwebtoken

**Lý do:**
- Match đúng yêu cầu đề bài
- PostgreSQL connection pool được cấu hình sẵn trong `src/utils/db.js` (max 20 conn, parameterized queries)
- Hoàn toàn chủ động về security (bcrypt salt rounds = 12)
- JWT payload chứa `{ id, email }`, verify ở middleware `src/middlewares/auth.js`

**Files changed:**
- `src/services/auth.service.js` — register, login, getMe, refreshToken bằng raw SQL
- `src/controllers/auth.controller.js` — request handlers
- `src/routes/auth.routes.js` — wired rate limiter + validate middleware
- `src/middlewares/auth.js` — JWT verification (đã có sẵn, payload là `{ id, email }`)
- `src/utils/validators.js` — password min length: 8 → 6

---

### 4/4/2026 — Rate Limiting: express-rate-limit ở route-level

**Vấn đề:** Cần áp dụng rate limit khác nhau cho register (3 req/phút) và login (5 req/phút).

**Lựa chọn:**
- Global rate limiter (1 middleware cho toàn app) → không linh hoạt
- Route-level rate limiter (factory function `rateLimiter()`) → có thể cấu hình per-route

**Quyết định:** Route-level qua factory function `rateLimiter(maxRequests, windowSeconds, message)`

**Lý do:**
- Linh hoạt: mỗi route có limit riêng
- Dùng `express-rate-limit` (đã có trong dependencies)
- Skip health check endpoint để tránh ảnh hưởng monitoring

---

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
