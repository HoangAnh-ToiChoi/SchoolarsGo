# ScholarsGo — Nhật ký thay đổi

Mục mới thêm ở trên cùng. Các phần "Lịch sử" bên dưới là nhật ký cũ gộp từ `DEVLOG.md`, `CHANGELOG.md` và `frontend/CHANGES.md`, giữ nguyên nội dung gốc.

## 11/2026 — Lịch deadline mới, rút gọn CSS, dọn file cũ

- Lịch deadline chỉ hiện mốc của riêng người dùng: hạn nộp học bổng đã lưu, hạn nộp và ngày hỏi lại kết quả (14 ngày sau khi nộp) của đơn ứng tuyển. Có chú thích màu, danh sách "Sắp tới", trạng thái rỗng. Sửa lỗi một học bổng hiện 2 lần; lấy tối đa 50 đơn thay vì 20.
- Tự vẽ lịch tháng, bỏ thư viện `react-calendar`.
- `frontend/src/index.css` rút từ 318 xuống 63 dòng: bỏ class không còn dùng, các class cũ viết lại bằng token Tailwind.
- Xóa file cũ: `supabase/kong`, kiểm thử e2e cũ (`tests/`, `playwright.config.js`, `package.json` gốc) vì nhắm vào giao diện đã bỏ, 7 script debug một lần trong `backend/scripts/`.

## 11/2026 — Làm lại giao diện frontend (nhánh `refactor/frontend-ui-v2`, `refactor/search-on-home`)

- Cấu trúc mới: mỗi trang/component là `folder/index.jsx`, import bằng `~/`.
- Thêm shadcn/ui, Heroicons solid; Redux Toolkit thay Zustand.
- Khung mới: header (logo | thanh tìm kiếm giữa | thông báo + tài khoản), sidebar sticky, menu tài khoản sổ xuống.
- Trang chủ mới hiện học bổng ngay; kết quả tìm kiếm hiện ở trang chủ, bỏ trang Tìm học bổng riêng.
- Một thanh tìm kiếm duy nhất trên header, bảng 8 bộ lọc hiện khi bấm vào ô tìm kiếm.
- Bảng màu chỉ còn 5 màu gốc trong `frontend/src/index.css`.
- Chống XSS: `safeUrl`, `sanitizeHtml`, Content-Security-Policy.
- Hiệu ứng trượt lên khi có dữ liệu, thông báo khi tải quá 5 giây.
- Bản demo GitHub Pages (`npm run build:pages`).
- Dọn tài liệu: quy ước gom về `CLAUDE.md`; tài liệu cũ chuyển vào `docs/archive/`.
- Đổi toàn bộ tên do dự án đặt sang camelCase; tách layouts/userLayout và layouts/adminLayout (PR #23); route `/forgotPassword`, `/resetPassword`.

---

## Lịch sử: nhật ký phát triển (DEVLOG.md cũ)


> Nền tảng tìm kiếm học bổng và quản lý hồ sơ du học cho sinh viên Việt Nam.
> **Stack:** React 18 + Vite + TailwindCSS + Zustand (frontend) | Node.js + Express + Supabase/PostgreSQL (backend)

---

## Giai đoạn 1 — Khởi động dự án (28/03/2026)

- Tạo repo, thiết lập cấu trúc thư mục `frontend/` và `backend/`
- Cài đặt môi trường cơ bản: Vite, Express, cấu hình `.env`

---

## Giai đoạn 2 — Backend Supabase Cloud + Seed dữ liệu (31/03 – 10/04/2026)

- Tích hợp **Supabase Cloud** thay thế local PostgreSQL
- Viết seed script (`seedCloud.js`) nhập 66 học bổng thực tế vào DB
- Chuyển `seedCloud.js` sang dùng `pg Pool`, fix `PG_HOST localhost`
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

- Xây scraper `scripts/scrapeMulti.js` thu thập học bổng từ nhiều nguồn:
  - scholars4dev.com (35 trang)
  - scholarship-positions.com
  - opportunitiesforafricans.com
  - và 3 nguồn bổ sung khác
- Fix scraper dùng **sentinel date `2099-01-01`** khi không parse được deadline
- Thêm **global URL dedup cache** để tránh fetch trùng bài
- Thêm `checkDb.js` script kiểm tra nhanh số lượng bản ghi

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
- Route: `POST /api/auth/forgotPassword` và `POST /api/auth/resetPassword` (có rate limiter + validation)
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
- Route `/forgotPassword` và `/resetPassword` được thêm vào `App.jsx`

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

---

## Lịch sử: thay đổi frontend 05/2026 (frontend/CHANGES.md cũ)


> Branch: `feat/ai-recommend-ui-improvements`  
> Tổng thay đổi: **63 files**, +3532 / −3031 dòng  
> Ngày: 2026-05-20

---

## 1. Design System — Toàn bộ chuyển sang Obsidian + Cyan Glow

### `tailwind.config.js` — Viết lại hoàn toàn

Bộ màu cũ (trắng/slate/purple gradient) bị thay thế bởi **GitHub Dark–inspired dark palette**:

| Token | Giá trị | Dùng cho |
|---|---|---|
| `ink-950` | `#0D1117` | Background trang chính |
| `ink-900` | `#161B22` | Card, sidebar |
| `ink-800` | `#21262D` | Border, input bg |
| `ink-700` | `#30363D` | Border hover |
| `ink-500` | `#6E7681` | Placeholder, muted |
| `ink-300` | `#B1BAC4` | Secondary text |
| `ink-100` | `#E6EDF3` | Primary text |
| `primary-400` | `#22D3EE` | Accent chính (cyan) |
| `primary-300` | `#67E8F9` | Accent hover |

**Box shadows mới:**
```
shadow-glow      → 0 0 20px rgba(34,211,238,0.25)
shadow-glow-lg   → 0 0 40px rgba(34,211,238,0.35)
shadow-glow-sm   → 0 0 10px rgba(34,211,238,0.15)
shadow-card-hover → 0 8px 24px rgba(0,0,0,0.5)
```

**Keyframe animations mới:**
- `pulseGlow` — box-shadow cyan nhịp 3s
- `shimmer` — background-position sweep
- `float` — translateY -8px / 6s
- `fade-in-up`, `fade-in-up-1/2/3` — stagger entrance

---

### `src/index.css` — Viết lại hoàn toàn

**Trước:** body `color: #111827`, `background: #f1f5f9` (light)  
**Sau:** body `color: #E6EDF3`, `background: #0D1117` (dark)

Các class component đã đổi sang hex trực tiếp (không dùng `@apply` với custom token vì Tailwind v3 không hỗ trợ trong `@layer components`):

| Class | Thay đổi chính |
|---|---|
| `.card` | `bg: #161B22`, `border: #21262D` |
| `.card-hover` | hover: `border-primary-400/40`, lift `translateY(-4px)` |
| `.card-glow` | hover: `box-shadow: 0 0 30px rgba(34,211,238,0.2)` |
| `.btn-primary` | `bg: #22D3EE`, `color: #0D1117`, hover glow |
| `.btn-secondary` | `bg: #21262D`, `border: #30363D` |
| `.btn-ghost` | `color: #8B949E`, hover `bg: #21262D` |
| `.btn-danger` | `bg: rgba(239,68,68,0.1)`, `color: #f87171` |
| `.input` | `bg: #0D1117`, `border: #30363D`, focus cyan ring |
| `.badge-*` | opacity-10 dark backgrounds + border |
| `.tag` | `bg: #21262D`, `color: #8B949E` |
| `.modal-overlay` | `backdrop-filter: blur(4px)` |
| `.bg-grid` | Subtle cyan grid pattern 64×64px |

**Thêm mới:**
- `.text-gradient-cyan` — gradient text 135deg cyan
- `.glow-text` — `text-shadow: 0 0 30px rgba(34,211,238,0.5)`
- Custom scrollbar dark (6px, `#30363D` thumb)
- `::selection` — cyan highlight
- React Calendar dark overrides (toàn bộ)

---

## 2. Hooks mới

### `src/hooks/useInView.js` *(mới)*
Intersection Observer hook để trigger animation khi element vào viewport:
```js
const [ref, inView] = useInView({ threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
// Disconnect sau lần đầu → chỉ animate 1 lần
```

### `src/hooks/useCounter.js` *(mới)*
Animated counter dùng `requestAnimationFrame` với easing ease-out cubic:
```js
const count = useCounter(500, 1600); // animate từ 0 → 500 trong 1.6s
```

---

## 3. Components mới & cập nhật

### `src/components/ChatFAB.jsx` *(mới)*
Floating Action Button xuất hiện ở **góc dưới phải** trên mọi trang (ẩn tự động trên `/chat`):
- Ping ring animation cyan mỗi 2.4s
- Glow shadow tăng khi hover (`0 0 32px rgba(cyan,0.5)`)
- Badge "AI" pop-in sau 1s
- Tooltip slide-in từ phải khi hover
- Spring animations: scale 0→1 khi mount, `whileHover: 1.1`, `whileTap: 0.93`

### `src/components/Layout.jsx`
- Thêm `<ChatFAB />` vào layout

### `src/components/Header.jsx`
- Background: `bg-ink-950/90 backdrop-blur-md border-b border-ink-800`
- Logo: `bg-primary-400` (cyan solid) thay vì purple gradient
- Active link: `text-primary-400 bg-primary-400/10`
- Hover link: `hover:text-ink-100 hover:bg-ink-800`
- Mobile menu: dark styled

### `src/components/Footer.jsx`
- Bỏ conditional background theo route
- Thống nhất: `border-t border-ink-800 bg-ink-950`
- Logo: `bg-primary-400` + `text-ink-950`
- Links: `text-ink-500` → hover `text-ink-100`

### `src/components/ScholarshipCard.jsx`
- Wrap `motion.div` với `useInView` + stagger theo `index % 6`
- Card: `bg-ink-900 border-ink-800 hover:border-primary-400/40 hover:-translate-y-1`
- Image: `group-hover:scale-105`
- Title: `group-hover:text-primary-300`
- Save button: `text-danger-400 bg-danger-400/10`

### `src/components/ComparisonBar.jsx`
- `bg-ink-950/95 backdrop-blur-md border-t border-ink-800`
- Chips: `bg-ink-900 border-ink-800`
- Compare button: `btn-primary btn-sm`

### `src/components/LoadingSpinner.jsx`
- Spinner: `border-ink-800 border-t-primary-400` (cyan)

### `src/components/LatestNewsSection.jsx` — Viết lại
- `bg-ink-950` section background
- Featured card: `bg-ink-900 border-ink-800 hover:border-primary-400/40 hover:-translate-y-1`
- Side list: `bg-ink-900 divide-ink-800 hover:bg-ink-800`
- Title hover: `group-hover:text-primary-300`
- TAG_STYLE → dark opacity variants

### `src/components/landing/Hero.jsx` — Viết lại
- Framer Motion `containerVariants` + `itemVariants` stagger toàn bộ
- `bg-grid` pattern + ambient orbs (blurred divs)
- Heading: `text-gradient-cyan glow-text` cho accent
- `StatItem`: `useInView` + `useCounter` → animated numbers (500+, 50+, 10000+)
- Social proof: avatar circles + star rating
- CTAs: `btn-primary btn-lg` + `btn-secondary btn-lg`

### `src/components/landing/Features.jsx` — Viết lại
- 6 features (tăng từ 3)
- `useInView` + `cardVariants` với delay theo index
- Hover: border cyan + lift + radial gradient glow overlay
- Icon boxes color-coded

### `src/components/landing/ScholarshipPreview.jsx`
- Dark card tokens

### `src/components/ui/Badge.jsx`
- `colorMap` → dark opacity-10 backgrounds với border

### `src/components/ui/Input.jsx`
- Icon: `text-ink-500`, error: `text-danger-400`

### `src/components/ui/FileUpload.jsx`
- Drag area: `border-ink-700` dashed, hover `border-primary-400/60`
- Active drag: `border-primary-400 bg-primary-400/10`

### `src/components/ui/PageHeader.jsx`
- Nhận prop `icon`, render eyebrow badge
- `bg-ink-950 border-b border-ink-800`

### `src/components/ui/AnimatedPage.jsx` *(mới)*
- Wrapper Framer Motion cho page transition

### ~~`src/components/landing/AuroraBackground.jsx`~~ *(đã xóa)*

---

## 4. Pages — Toàn bộ migrate sang dark theme

### `src/pages/LoginPage.jsx` / `RegisterPage.jsx` / `ForgotPasswordPage.jsx` / `ResetPasswordPage.jsx`
- Container: `bg-ink-950`
- Card: `bg-ink-900 border-ink-800`
- Submit button: `bg-primary-400 text-ink-950`
- `motion.div` page fade-in

### `src/pages/ForgotPasswordPage.jsx` *(mới)*
### `src/pages/ResetPasswordPage.jsx` *(mới)*
- Flow quên/đặt lại mật khẩu, full dark theme

### `src/pages/HomePage.jsx`
- `bg-ink-950`, `motion.div` wrapper

### `src/pages/ScholarshipsPage.jsx`
- Search bar: `bg-ink-900 border-ink-800`
- Filters: dark select
- Pagination: active page `bg-primary-400 text-ink-950`

### `src/pages/ScholarshipDetailPage.jsx` — Viết lại hoàn toàn
- Hero: `bg-ink-900 border-ink-800`, fact pills `bg-ink-800 text-ink-300`
- Sticky bar: `bg-ink-950/95 backdrop-blur-md` slide-up với Framer Motion
- CTA primary: `bg-primary-400 text-ink-950 hover:shadow-glow`
- Save button: `border-danger-400/50 text-danger-400` khi đã lưu
- Deadline panel: `bg-ink-950`, amount `text-success-400`
- DetailSection: `bg-ink-900 border-ink-800`, `whileInView` scroll animation
- InfoRow: `bg-ink-950 border-ink-800`, cyan icon boxes `bg-primary-400/10`
- Action plan: `bg-primary-400/5 border-primary-400/20`
- `motion.div` fade-in toàn trang

### `src/pages/DashboardPage.jsx`
- Stat values: `text-primary-400`
- Cards: dark tokens

### `src/pages/ApplicationsPage.jsx` / `ApplicationDetailPage.jsx`
- `bg-ink-950`, dark cards
- Status badges: dark opacity variants

### `src/pages/SavedPage.jsx`
- `bg-ink-950`

### `src/pages/ProfilePage.jsx`
- Full dark, avatar upload area dark

### `src/pages/ChatPage.jsx` — Viết lại + nâng cấp animation

**Layout mới — 2 cột:**
- **Sidebar (desktop, 288px):** Bot info card, 5 capabilities với icon, disclaimer note
- **Main area:** header + messages + input

**MessageBubble — animation nâng cấp:**
- User message: spring slide từ phải `x: 28 → 0` (`stiffness: 360, damping: 26`)
- Bot message: spring slide từ trái `x: -28 → 0`
- Avatar: `scale: 0 → 1` spring riêng biệt (`stiffness: 520`), delay 60ms
- `whileHover: scale(1.015)` trên bubble
- Copy button fade-up sau 280ms

**TypingIndicator — nâng cấp:**
- Cùng directional spring animation như bot message
- 3 dots: `motion.span` animate `y: 0 → -7 → 0` + màu `ink-500 → cyan → ink-500`, stagger 170ms

**WelcomeScreen *(mới)*:**
- Hiển thị khi chưa chat: bot avatar lớn `animate-pulse-glow`, online dot
- 4 quick-reply cards dạng grid 2×2 với icon riêng
- `cardVariants` stagger, `whileHover/whileTap` spring
- Heading/subtitle/footer fade-in tuần tự

**Input area:**
- Border focus: `border-primary-400/50 shadow-glow-sm`
- Character counter hiện sau 500 ký tự, đỏ khi > 900
- Send button chỉ sáng khi có nội dung

**Header:**
- Hiển thị "Đang soạn phản hồi..." với spinner khi loading

### `src/pages/RecommendPage.jsx`
- Hero: `bg-ink-950 border-b border-ink-800`
- Brain icon: `bg-primary-400/15 text-primary-300`
- Label: `text-primary-400`

### `src/pages/NewsPage.jsx`
- `PageHeader` component
- Filter tabs: active `bg-primary-400 text-ink-950`
- Cards: `bg-ink-900 border-ink-800`

### `src/pages/ComparisonPage.jsx`
- Full dark tokens

### `src/pages/DeadlineTrackerPage.jsx`
- Calendar: React Calendar dark overrides (full CSS)
- Sidebar cards: `bg-ink-900 border-ink-800`

### `src/pages/NotFoundPage.jsx`
- `bg-ink-950 text-ink-100`

### `src/pages/admin/AdminUsersPage.jsx`
- Table: `bg-ink-900 border-ink-800`
- Role badge: dark opacity variant

---

## 5. Framer Motion — Patterns sử dụng

```js
// Page transition
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />

// Scroll-triggered card (useInView)
<motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} />

// Spring directional (chat messages)
initial={{ opacity: 0, x: isUser ? 28 : -28, scale: 0.86 }}
animate={{ opacity: 1, x: 0, scale: 1 }}
transition={{ type: 'spring', stiffness: 360, damping: 26 }}

// Avatar pop
initial={{ scale: 0 }} animate={{ scale: 1 }}
transition={{ type: 'spring', stiffness: 520, damping: 26, delay: 0.06 }}

// Stagger children
const containerVariants = { visible: { transition: { staggerChildren: 0.08 } } }
```

---

## 6. Backend (các thay đổi liên quan)

| File | Thay đổi |
|---|---|
| `src/controllers/auth.controller.js` | Bổ sung forgot/reset password endpoints |
| `src/controllers/chat.controller.js` | Cải thiện error handling |
| `src/services/auth.service.js` | Reset token logic |
| `src/utils/mailer.js` *(mới)* | Nodemailer setup gửi email reset |
| `migrations/002_add_password_reset.sql` *(mới)* | Thêm bảng/cột cho password reset |
| `src/middlewares/rateLimiter.js` | Điều chỉnh limits |
| `src/services/chat.service.js` | Groq + Zhipu fallback chain |

---

## 7. Files mới tạo (untracked)

| File | Mô tả |
|---|---|
| `src/components/ChatFAB.jsx` | Floating chatbot button |
| `src/components/ui/AnimatedPage.jsx` | Page transition wrapper |
| `src/hooks/useInView.js` | Intersection Observer hook |
| `src/hooks/useCounter.js` | RAF-based animated counter |
| `src/pages/ForgotPasswordPage.jsx` | Quên mật khẩu |
| `src/pages/ResetPasswordPage.jsx` | Đặt lại mật khẩu |
| `backend/src/utils/mailer.js` | Email service |
| `backend/scripts/migrations/002_add_password_reset.sql` | DB migration |
| `DEVLOG.md` | Dev log tổng hợp |
| `tests/` | Playwright test suite |
| `playwright.config.js` | Playwright config |

---

## 8. Tóm tắt impact

| Hạng mục | Trước | Sau |
|---|---|---|
| Theme | Light (slate/white) | Dark (Obsidian + Cyan Glow) |
| Animation | Không có | Framer Motion toàn bộ |
| Chat UI | 1 cột đơn giản | 2 cột, sidebar, animated bubbles |
| Floating CTA | Không có | ChatFAB với ping + glow |
| Landing Hero | Static | Animated counter + stagger |
| Scroll animations | Không có | useInView trên mọi section |
| CSS design tokens | `--color-primary: #2563eb` (blue) | `--color-ink-*` + `--color-primary-400: #22D3EE` |

---

## Lịch sử: tích hợp Supabase backend 03/2026 (CHANGELOG.md cũ)


**Branch:** `backend-supabase-seed`
**Created:** 2026-03-31
**Author:** Generated with AI Assistant

---

## Tổng quan

Branch này tích hợp Supabase Cloud làm database backend và bổ sung script seed dữ liệu học bổng thực tế từ nguồn [scholars4dev.com](https://www.scholars4dev.com).

---

## Các thay đổi chính

### 1. Supabase Client (`backend/src/utils/db.js`) — **MỚI**

Kết nối Supabase Cloud qua biến môi trường. Dùng **service_role key** (bypass RLS) để seed script có quyền ghi không giới hạn.

```
SUPABASE_URL       = https://mthxqvnukejvjadldwob.supabase.co
SUPABASE_ANON_KEY  = <public anon key — client-side>
SUPABASE_SERVICE_ROLE_KEY = <service role key — server-side only, NEVER commit>
```

> **Lưu ý bảo mật:** `SUPABASE_SERVICE_ROLE_KEY` tuyệt đối không commit vào git. Kiểm tra `.env` đã được `.gitignore` hay chưa.

---

### 2. Database Schema (`database.sql`) — **CẬP NHẬT**

#### Migration v0.3 (2026-03-31)

Hai câu SQL migrate trên Supabase Dashboard:

```sql
-- 1. Thêm unique constraint trên title
ALTER TABLE scholarships ADD CONSTRAINT scholarships_title_key UNIQUE (title);

-- 2. Tăng country VARCHAR(100→255) để chứa dữ liệu scrape dài
ALTER TABLE scholarships ALTER COLUMN country TYPE VARCHAR(255);
```

**Lý do:** Script seed dùng `ON CONFLICT (title) DO NOTHING` nên cần constraint trên `title`. Nếu bạn chạy seed mà gặp lỗi `there is no unique or exclusion constraint matching the ON CONFLICT specification`, hãy chạy 2 câu SQL trên trong Supabase SQL Editor.

---

### 3. Backend Services (`backend/src/services/`)

| File | Mô tả |
|------|-------|
| `auth.service.js` | Xác thực: register, login, đổi password |
| `profile.service.js` | CRUD hồ sơ user |
| `scholarship.service.js` | CRUD học bổng, filter/search |
| `application.service.js` | Quản lý đơn ứng tuyển |
| `saved.service.js` | Lưu/tracking học bổng |
| `document.service.js` | Upload tài liệu |
| `recommend.service.js` | Gợi ý học bổng cá nhân hóa |

---

### 4. Seed Script (`backend/scripts/seedCloud.js`) — **MỚI**

Đổ dữ liệu học bổng từ `scholars4dev.com` vào Supabase Cloud.

#### Cách chạy

```bash
cd backend
npm install
node scripts/seedCloud.js
```

#### Quy trình hoạt động

```
1. Kết nối Supabase → kiểm tra số học bổng hiện tại
2. Thử RSS feed (thường trả về 0 → fallback)
3. Fallback: scrape 5 categories bằng axios + cheerio
   - masters-scholarships
   - phd-scholarships
   - fully-funded-scholarships
   - undergraduate-scholarships
   - scholarships-in-usa-for-international-students
4. Deduplicate theo title (so sánh string đã lowercase + trim)
5. Upsert batch 50 bản ghi vào Supabase
6. Báo cáo kết quả
```

#### Các lỗi thường gặp khi chạy lại seed

| Lỗi | Nguyên nhân | Cách xử lý |
|------|------------|------------|
| `ON CONFLICT specification` | Chưa chạy migration | Chạy 2 câu ALTER TABLE trong SQL Editor |
| `value too long for VARCHAR(255)` | Trường dữ liệu quá dài | Đã xử lý bằng `normalizeForDB()` truncate |
| `null value in column "deadline"` | Thiếu deadline | Script tự gán mặc định +1 năm |
| `23505 unique_violation` | Trùng title | `ON CONFLICT (title) DO NOTHING` bỏ qua |

#### Kết quả seed lần đầu (2026-03-31)

```
✅ Inserted : 66 bản ghi
⏭️  Skipped : 0
❌ Errors  : 0
📊 Tổng học bổng active trong DB : 66
```

---

### 5. Package Dependencies (`backend/package.json`)

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "axios": "^1.6.0",
  "cheerio": "^1.0.0",
  "dotenv": "^16.4.0",
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "multer": "^1.4.5-lts.1",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3"
}
```

---

## Checklist cho đồng đội

- [ ] Clone repo → `npm install` trong `backend/`
- [ ] Copy `.env.example` → `.env` → điền `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Chạy 2 câu migration SQL trên Supabase Dashboard (xem mục 2)
- [ ] Chạy `node scripts/seedCloud.js` để seed dữ liệu ban đầu
- [ ] Start backend: `node src/index.js`

---

## Supabase Project Info

- **Project URL:** https://mthxqvnukejvjadldwob.supabase.co
- **Region:** Châu Á (Asia)
- **Tables:** users, scholarships, applications, saved_scholarships, documents, profiles

---

## Gitignore cần kiểm tra

Đảm bảo các file sau **KHÔNG** bị commit:

```
backend/.env
backend/node_modules/
```

Kiểm tra: `git diff .gitignore` hoặc mở file `.gitignore`.
