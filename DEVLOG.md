# ScholarsGo — Nhật ký phát triển

> Nền tảng tìm kiếm học bổng và quản lý hồ sơ du học cho sinh viên Việt Nam.
> **Stack:** React 18 + Vite + TailwindCSS + Zustand (frontend) | Node.js + Express + Supabase/PostgreSQL (backend)

---

## Giai đoạn 1 — Khởi động dự án (28/03/2026)

- Tạo repo, thiết lập cấu trúc thư mục `frontend/` và `backend/`
- Cài đặt môi trường cơ bản: Vite, Express, cấu hình `.env`

---

## Giai đoạn 2 — Backend Supabase Cloud + Seed dữ liệu (31/03 – 10/04/2026)

- Tích hợp **Supabase Cloud** thay thế local PostgreSQL
- Viết seed script (`seed-cloud.js`) nhập 66 học bổng thực tế vào DB
- Chuyển `seed-cloud.js` sang dùng `pg Pool`, fix `PG_HOST localhost`
- Thêm test user seed script và `JWT_SECRET` fallback
- Fix dotenv trong seed script và bật Supabase Cloud connection mặc định

---

## Giai đoạn 3 — Frontend Design System (04 – 05/04/2026)

- Xây dựng **UI Library primitives**: Button, Input, Card, Badge, Select, Modal...
- Thống nhất design system: màu sắc, typography, spacing
- Thêm surface tokens, thay `bg-white` bằng off-white trên tất cả surfaces
- Xây dựng layout trang chủ, dynamic country filter, card hover animation
- Thêm isFetching spinner khi đang tải dữ liệu

---

## Giai đoạn 4 — Kết nối API Học bổng (10 – 19/04/2026)

- Wire **search filters và pagination** từ frontend sang backend API
- Wire **scholarship detail page** với dữ liệu thực từ backend
- Áp dụng kiến trúc **OOP 4 layer** cho module Scholarships (4 API endpoints)
- Upload và delete document API

---

## Giai đoạn 5 — Tính năng Dashboard & Responsive (02 – 03/05/2026)

- Xây **DashboardPage**: thống kê cá nhân, deadlines sắp tới
- Fix responsive mobile trên nhiều trang
- Thêm route `/deadlines` với `ProtectedRoute`
- Fix `ScholarshipCard` bị lỗi khi `scholarship.id` là undefined
- Thêm `ErrorBoundary` bọc `Outlet` trong `Layout` để bắt lỗi runtime

---

## Giai đoạn 6 — Backend OOP Refactor toàn diện (03 – 04/05/2026)

- **Refactor toàn bộ 7 backend modules** sang OOP 4-layer (Controller → Service → Repository → DB)
- Tích hợp **EventBus architecture** cho side effects
- Fix timezone cho deadline, fix `errorHandler` JSON parse
- Thêm upload MIME type validation
- Thêm 401 redirect trong `api.js` interceptor

---

## Giai đoạn 7 — Aurora Dark Theme — Redesign UI toàn bộ (09 – 10/05/2026)

- Áp dụng **Aurora dark glassmorphic theme** (nền `#050510`, gradient tím-cyan, blur)
- Redesign tất cả các trang: Login, Register, Profile, Scholarships, Detail, Applications...
- Thêm **Framer Motion** page transitions và list/table animations
- Tạo `AnimatedPage` component dùng chung
- Fix light mode cho input/label, calendar CSS

---

## Giai đoạn 8 — Admin Module (09 – 13/05/2026)

- Xây **Admin Dashboard frontend**: quản lý users và scholarships
- Thêm `adminService` và `useAdmin` hooks
- Cài `recharts` cho biểu đồ thống kê admin
- Backend: Admin module đầy đủ với OOP refactoring và **role-based auth**
- Thêm **dark mode toggle** trên toàn app

---

## Giai đoạn 9 — AI Recommend + Chatbot (14 – 15/05/2026)

### Chatbot ScholarsBot
- Xây dựng **ScholarsBot AI chatbot** tích hợp Gemini
- Fix 6 lỗi chatbot: bảo mật, logic xử lý context, UX
- Thêm **Groq + Zhipu fallback chain**: Gemini → Groq → Zhipu để tăng độ tin cậy khi quota hết
- Lưu lịch sử chat vào DB

### AI Recommend
- Xây **rule-based scoring**: GPA (30đ), degree (20đ), country (20đ), major (15đ), IELTS (10đ), deadline (5đ)
- Tích hợp **Gemini** để generate lý do gợi ý tự nhiên thay vì chỉ điểm số

---

## Giai đoạn 10 — Scraper đa nguồn (16 – 17/05/2026)

- Xây scraper `scripts/scrape-multi.js` thu thập học bổng từ nhiều nguồn:
  - scholars4dev.com (35 trang)
  - scholarship-positions.com
  - opportunitiesforafricans.com
  - và 3 nguồn bổ sung khác
- Fix scraper dùng **sentinel date `2099-01-01`** khi không parse được deadline
- Thêm **global URL dedup cache** để tránh fetch trùng bài
- Thêm `check-db.js` script kiểm tra nhanh số lượng bản ghi

---

## Giai đoạn 11 — CI/CD + Monitoring (17/05/2026)

- Thêm **GitHub Actions CI** pipeline (lint + test)
- Cấu hình **Railway** (backend deploy) và **Vercel** (frontend deploy)
- Tích hợp **Sentry** error monitoring cho backend
- Fix 3 lỗi critical: country data normalization, Sentry config, chat history
- Thêm **ESLint** config cho cả backend và frontend

---

## Giai đoạn 12 — Migrate DB sang supabase-js + OOP merge (17/05/2026)

- **Migrate toàn bộ DB queries** từ `pg Pool` sang `@supabase/supabase-js` REST API
- Merge nhánh OOP/TDA refactor, fix 2 critical bugs hậu-merge
- Thêm **tin tức cập nhật** trên homepage thay thế học bổng nổi bật

---

## Giai đoạn 13 — Bảo mật: JWT → httpOnly Cookie (05/2026)

- **Tăng cường `JWT_SECRET`**: đổi sang 64-char hex random (256-bit entropy)
- **Di chuyển JWT từ `localStorage` sang `httpOnly cookie`**:
  - Backend: thêm `COOKIE_OPTIONS` (`httpOnly: true`, `SameSite=lax`, `secure` trong prod, 7 ngày TTL)
  - Thêm `#setAuthCookie()` / `#clearAuthCookie()` private methods trong auth controller
  - `login` / `register` trả về `{ user }` trong body, không còn expose token
  - `logout` clear cookie phía server
- Frontend: bỏ `Authorization: Bearer` header, thêm `withCredentials: true` vào axios
- `authStore` bỏ hoàn toàn `token` khỏi state; `partialize` chỉ persist `{ user, isAuthenticated }`

---

## Giai đoạn 14 — Tính năng Quên mật khẩu (05/2026)

**Backend:**
- DB migration `002_add_password_reset.sql`: thêm cột `reset_token` (VARCHAR 64) và `reset_token_expires` (TIMESTAMPTZ) vào bảng `users`
- `auth.service.js`: `forgotPassword()` — tạo `crypto.randomBytes(32)` → SHA-256 hash → lưu DB → gửi email; `resetPassword()` — verify hash, kiểm tra expiry (1h), bcrypt password mới
- `auth.repository.js`: thêm `saveResetToken()`, `findByResetToken()`, `clearResetToken()`
- `mailer.js`: nodemailer với Gmail SMTP; fallback log ra console khi SMTP chưa cấu hình
- Route: `POST /api/auth/forgot-password` và `POST /api/auth/reset-password` (có rate limiter + validation)
- Chống **email enumeration**: luôn trả về success dù email không tồn tại

**Frontend:**
- `ForgotPasswordPage.jsx`: form nhập email, hiện "Đã gửi email!" sau submit
- `ResetPasswordPage.jsx`: đọc `?token=` từ URL, validate password + confirm, gọi API
- `LoginPage.jsx`: thêm link "Quên mật khẩu?" bên dưới ô password
- `useAuth.js`: thêm `useForgotPassword` và `useResetPassword` hooks

---

## Giai đoạn 15 — Tối ưu hiệu năng Bundle (05/2026)

- **Lazy load toàn bộ pages** với `React.lazy` + `Suspense`
- Thêm `PageLoader` spinner (vòng tròn tím xoay) làm fallback
- **Kết quả: bundle giảm từ 785KB → 380KB (-51%)**
- Route `/forgot-password` và `/reset-password` được thêm vào `App.jsx`

---

## Giai đoạn 16 — Rate Limiter Dev/Prod (05/2026)

- Tách `authLimiter` theo môi trường:
  - **Production**: 5 request / 15 phút (bảo vệ brute-force)
  - **Development/Test**: 200 request / phút (không chặn E2E tests)
- Tương tự `apiLimiter`: prod 100 req/min, dev 500 req/min

---

## Giai đoạn 17 — In-memory Cache + UX fixes (05/2026)

- **Countries endpoint**: thêm in-memory cache 10 phút (`#countriesCache`) trong `scholarship.service.js`
- **Hero live scholarship count**: `Hero.jsx` nhận prop `totalScholarships`, hiển thị số thực thay vì hardcode "500+"
- **Sticky Apply Bar** trên `ScholarshipDetailPage`: dùng `IntersectionObserver` theo dõi hero CTA, hiện thanh sticky ở bottom khi scroll qua
- **`useSavedScholarships`**: thêm `enabled: isAuthenticated` để không gọi API khi chưa đăng nhập, tránh 401 redirect

---

## Giai đoạn 18 — E2E Testing với Playwright (05/2026)

**Cài đặt:**
- Cài `@playwright/test`, tạo `playwright.config.js` (Chromium only, `retry: 1`, html reporter)
- `baseURL: http://localhost:5173`, không dùng `webServer` (server khởi động thủ công)

**Test suites (12 tests):**

| File | Test cases |
|------|-----------|
| `tests/e2e/auth.spec.js` | Register user, Login hợp lệ, Login sai mật khẩu, Forgot password page, Forgot password submit, Protected route redirect |
| `tests/e2e/scholarships.spec.js` | Hiển thị scholarship cards, Search filter, Detail page, Save/unsave scholarship |
| `tests/e2e/applications.spec.js` | Empty state CTA, Tạo application từ detail page |

**Bugs phát hiện và fix qua quá trình chạy test:**
- `getByLabel` thất bại vì `Input` component không liên kết `htmlFor` → đổi sang `locator('input[type="..."]')`
- `/scholarships` redirect về `/login` vì `useSavedScholarships` gọi API khi chưa auth → thêm `enabled: isAuthenticated`
- Search placeholder không khớp → đổi sang `input[placeholder*="học bổng"]`
- Rate limiter 429 trong dev → tách `authLimiter` theo `NODE_ENV`
- `registerOrLogin` helper dùng toast text để phát hiện login fail → toast tự dismiss → miss → đổi sang check URL
- Button register tên "Tạo Tài Khoản" nhưng test dùng regex `/đăng ký/i` → fix regex
- Race condition: count applications trước khi API trả về → thêm `waitForLoadState('networkidle')`
- `getByText(/đã lưu|bỏ khỏi/i)` match 2 nav links → strict mode violation → đổi sang `/đã lưu học bổng/i` (toast)
- `registerOrLogin` không xử lý email đã tồn tại khi register → thêm fallback retry login
- Login test flaky lần đầu chạy vì `test-e2e@scholarsgo.com` chưa tồn tại → thêm `test.beforeAll` trong `auth.spec.js`

**Kết quả cuối: 12/12 tests passed ✅ (15 giây)**

---

## Tổng kết kỹ thuật

| Hạng mục | Chi tiết |
|----------|---------|
| **Frontend** | React 18, Vite, TailwindCSS, Zustand, React Query, Framer Motion |
| **Backend** | Node.js, Express, Supabase/PostgreSQL, JWT (httpOnly cookie) |
| **AI/ML** | Gemini 2.0 Flash, Groq, Zhipu (fallback chain) |
| **Auth** | httpOnly cookie, bcrypt, SHA-256 reset token, role-based access |
| **Email** | Nodemailer + Gmail SMTP |
| **Monitoring** | Sentry (backend) |
| **CI/CD** | GitHub Actions, Railway (BE), Vercel (FE) |
| **Testing** | Playwright E2E — 12 tests, Chromium |
| **Scraper** | Cheerio, multi-source, dedup cache, cron job |
| **Bundle** | 785KB → 380KB (-51%) via React.lazy code-splitting |
| **DB** | Supabase Cloud, ~250-300 học bổng (target 500+) |
