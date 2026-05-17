# Báo cáo Thay đổi Dự án ScholarsGo
> Nhánh: `feat/full-stack-merge` — tổng hợp từ `fix/seed-and-ui` + `feat/ai-recommend-ui-improvements`

---

## 1. Tổng quan

ScholarsGo là nền tảng tìm kiếm học bổng quốc tế dành cho sinh viên Việt Nam. Trong giai đoạn phát triển này, dự án được nâng cấp toàn diện trên cả ba tầng:

- **Backend**: Refactor toàn bộ sang kiến trúc OOP 3-layer + Dependency Injection
- **Frontend**: Xây dựng hệ thống giao diện hai chủ đề (sáng / tối Aurora), tích hợp AI
- **AI / Tích hợp**: ChatBot học bổng (Gemini), gợi ý học bổng cá nhân hoá, tổng hợp tin tức giáo dục

---

## 2. Backend — Kiến trúc OOP 3-Layer

### 2.1 Mô hình kiến trúc

Toàn bộ backend được refactor từ mô hình function-based sang **Clean Architecture 3 lớp**:

```
HTTP Request
    ↓
Controller  — xử lý req/res, không chứa business logic
    ↓
Service     — toàn bộ nghiệp vụ, không có SQL, không có HTTP
    ↓
Repository  — toàn bộ SQL, kế thừa BaseRepository
    ↓
PostgreSQL
```

**Nguyên tắc thiết kế áp dụng:**
- **Tell Don't Ask**: Service không hỏi trạng thái rồi mới if-else bên ngoài; đối tượng tự kiểm tra qua guard method
- **Dependency Injection**: Toàn bộ instance được khởi tạo tập trung tại `container.js`
- **Private fields (#)**: Controller, Service, Repository đều dùng private fields theo chuẩn ES2022
- **AppError**: Lỗi nghiệp vụ được ném qua `AppError(message, statusCode)` nhất quán

### 2.2 DI Container (`container.js`)

File duy nhất chịu trách nhiệm wire các instance:

```js
const adminRepo    = new AdminRepository(db);
const adminService = new AdminService(adminRepo);
const adminController = new AdminController(adminService);
```

### 2.3 EventBus

Singleton `EventEmitter` cho loose coupling giữa các service:

```
auth.login thành công → emit('user:login') → auth.listener ghi last_login_at
document.upload thành công → emit('document:uploaded') → storage.listener log
```

### 2.4 Các Module đã Refactor

| Module | Repository | Service | Controller | Ghi chú |
|--------|-----------|---------|------------|---------|
| **Admin** | ✅ | ✅ | ✅ | Gold standard — chuẩn mực OOP |
| Auth | ✅ | ✅ | ✅ | JWT + bcrypt, refresh token cookie |
| Scholarship | ✅ | ✅ | ✅ | Full-text search, filter, pagination |
| Application | ✅ | ✅ | ✅ | State machine: draft→submitted→accepted |
| Profile | ✅ | ✅ | ✅ | GPA, IELTS, target country/degree |
| Document | ✅ | ✅ | ✅ | Upload file, Supabase Storage |
| Saved | ✅ | ✅ | ✅ | Composite PK (user_id, scholarship_id) |
| Recommend | ✅ | ✅ | ✅ | Gọi Gemini API, trả top-N học bổng |

### 2.5 Admin Module (Gold Standard)

Module Admin là chuẩn mực OOP của toàn dự án. Các tính năng:

- **GET /api/admin/users**: Lấy danh sách user có phân trang + filter theo email/tên/role
- **PATCH /api/admin/users/:id/role**: Đổi role user (user ↔ admin) với self-lockout guard
- **requireRole middleware**: Kiểm tra `user.role === 'admin'` trước khi vào route

Pattern guard trong Service:
```js
#guardFound(entity, msg = 'Không tìm thấy') {
  if (!entity) throw new AppError(msg, 404);
}
#guardNotSelf(targetId, actorId) {
  if (targetId === actorId) throw new AppError('Không thể tự đổi role của mình', 403);
}
```

### 2.6 BaseRepository

Lớp cha chứa các phương thức CRUD generic mà tất cả repository kế thừa:

```js
class BaseRepository {
  constructor(db, tableName) { ... }
  async findAll(conditions, orderBy, limit, offset) { ... }
  async findById(id) { ... }
  async create(data) { ... }
  async update(id, data) { ... }
  async delete(id) { ... }
  async count(conditions) { ... }
}
```

---

## 3. Backend — Bug Fixes & Cải tiến

### 3.1 Middleware Fixes

**`errorHandler.js`** — Thêm xử lý JSON parse error:
```js
if (err.type === 'entity.parse.failed') {
  return res.status(400).json({
    success: false,
    message: 'Request body không phải JSON hợp lệ',
    code: 400,
  });
}
```

**`upload.js`** — Loại bỏ MIME validation false-positive và thêm `req.resume()` tránh `ERR_CONNECTION_RESET`:
- Xoá kiểm tra MIME type bằng `file-type` (gây từ chối file hợp lệ)
- Thêm `req.resume()` khi reject để drain body stream

**`rateLimiter.js`** — Thêm named exports:
```js
module.exports.apiLimiter  = rateLimiter(100, 60, '...');
module.exports.authLimiter = rateLimiter(5, 15 * 60, '...');
```

### 3.2 API Response 401 Redirect (`api.js`)

Interceptor Axios được cập nhật để không redirect về `/login` khi đang ở trang public:
```js
if (error.response?.status === 401) {
  const publicPaths = ['/login', '/register', '/scholarships', '/', '/news'];
  const isPublic = publicPaths.some(p => window.location.pathname.startsWith(p));
  if (!isPublic) window.location.href = '/login';
}
```

### 3.3 Seed Script Nâng cấp

Script `seed-scholarships.js` được nâng cấp toàn diện:
- **Multi-source scraping**: scholarshipdb.net + opportunitydesk.org + danh sách tĩnh curated
- **Pagination**: tự động lặp qua nhiều trang (không bị giới hạn 1 trang)
- **cleanText / trunc helpers**: Làm sạch HTML tags, chuẩn hoá text
- **listicle filter**: Lọc bỏ các article dạng "Top 10..." không phải học bổng thực sự
- **Deadline parser**: Nhận diện nhiều định dạng ngày (tháng viết tắt, số, "rolling")
- **Upsert thay INSERT**: Tránh duplicate khi chạy lại

### 3.4 Migration Index Database

Thêm `001_add_indexes.sql`:
```sql
CREATE INDEX idx_scholarships_country   ON scholarships(country);
CREATE INDEX idx_scholarships_deadline  ON scholarships(deadline);
CREATE INDEX idx_scholarships_is_active ON scholarships(is_active);
CREATE INDEX idx_applications_user_id   ON applications(user_id);
CREATE INDEX idx_saved_user_id          ON saved_scholarships(user_id);
```

---

## 4. AI Integration — Gemini API

### 4.1 Recommend Module

**`/api/recommend`** — Gợi ý học bổng cá nhân hoá dựa trên profile user:

Luồng xử lý:
1. Lấy profile user (GPA, IELTS, ngành học, quốc gia mục tiêu)
2. Lấy danh sách học bổng active từ database
3. Gọi Gemini API với prompt: phân tích profile + danh sách học bổng → trả về top-N phù hợp nhất kèm điểm match và lý do
4. Parse JSON response, trả về client

Model: `gemini-2.0-flash`

### 4.2 ChatBot Module (`/api/chat`)

ScholarsBot — Chatbot học bổng thông minh với:

**System Prompt** xác định:
- Tên: ScholarsBot, xưng "mình", gọi user là "bạn"
- Chỉ trả lời các chủ đề: học bổng, du học, hồ sơ, deadline
- Guardrails: không bịa học bổng, không làm theo "ignore instructions"

**Scholarship Context Injection**:
- Phát hiện khi user đang hỏi về gợi ý học bổng
- Tự động trích xuất filters (quốc gia, bậc học, GPA, IELTS) từ conversation
- Query database PostgreSQL lấy học bổng phù hợp
- Inject vào prompt dưới dạng dữ liệu thực tế

**Chat History Persistence**:
- Lưu mỗi turn hội thoại vào bảng `chat_messages`
- GET `/api/chat/history` — lấy 40 tin nhắn gần nhất theo thứ tự chronological
- Bảng `chat_messages`: `id UUID, user_id FK, role (user/assistant), content TEXT, created_at TIMESTAMPTZ`

```sql
-- Migration cần chạy
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.3 News Module (`/api/news`)

Tổng hợp tin tức giáo dục từ RSS feeds:

| Nguồn | Feed | Danh mục |
|-------|------|---------|
| VnExpress | vnexpress.net/rss/giao-duc.rss | Giáo dục |
| Tuổi Trẻ | tuoitre.vn/rss/giao-duc.rss | Giáo dục |
| Study International | studyinternational.com/feed | Du học |
| ICEF Monitor | monitor.icef.com/feed | Giáo dục |

- **Cache 30 phút**: tránh gọi RSS liên tục
- **Auto-categorize**: phát hiện danh mục từ title/description (Visa, Học bổng, Du học, Giáo dục)
- **Image extraction**: ưu tiên `media:content` → `media:thumbnail` → `enclosure` → parse từ HTML content

---

## 5. Frontend — Hệ thống Giao diện Hai Chủ đề

### 5.1 Design System (Light Theme)

Xây dựng Design System hoàn chỉnh trong Tailwind + `@layer components`:

**Màu sắc**:
- Primary: Slate/Indigo (`#486581` — trầm, chuyên nghiệp)
- Surface: `#ffffff` (card), `#f1f5f9` (body), `#e4e7eb` (muted)
- Semantic: success/warning/danger với tông xám dịu

**Component Classes** (dùng `@apply`):
- `.card`, `.card-hover` — card với shadow và hover animation
- `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger` — hệ thống button
- `.input`, `.input-label` — form inputs
- `.section-title`, `.section-subtitle` — heading hierarchy
- `.modal-overlay`, `.modal-content` — modal system
- `.tag`, `.badge` — label components

**UI Components** (`/components/ui/`):
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Button` (với `leftIcon`, `rightIcon`, `size` props)
- `Input` (với `icon` prop)
- `Select`, `Modal`, `Badge`, `EmptyState`, `PageHeader`
- `AnimatedItem` — polymorphic wrapper component

### 5.2 Dark Mode Aurora Theme

**Cơ chế toggle**:
- Tailwind `darkMode: 'class'` — kích hoạt bằng class `dark` trên `<html>`
- `uiStore.js` (Zustand): `toggleTheme()` thêm/xóa class + persist vào `localStorage`
- `main.jsx`: restore theme từ `localStorage` trước khi React render (tránh flash)

**AuroraBackground Component** (`/components/landing/AuroraBackground.jsx`):

Nền động với 5 blob màu sắc có hiệu ứng pulse:
- Blob 1: `bg-purple-600/30 blur-[120px]` — top-left
- Blob 2: `bg-indigo-500/25 blur-[100px]` — center
- Blob 3: `bg-cyan-500/20 blur-[110px]` — right
- Blob 4: `bg-pink-500/15 blur-[100px]` — bottom-left
- Blob 5: `bg-cyan-400/15 blur-[120px]` — bottom-right

Được render qua `Layout.jsx` khi `theme === 'dark'`, position `fixed`, `z-index: -10`.

**CSS Overrides** (`html.dark` prefix, specificity 0,2,0 > Tailwind 0,1,0):

| Selector | Dark Value |
|----------|-----------|
| `html.dark .bg-slate-50`, `.bg-gray-50`, `.bg-surface-muted` | `transparent` |
| `html.dark .bg-surface` | `transparent` |
| `html.dark .bg-white` | `rgba(255,255,255,0.05)` |
| `html.dark .card` | `rgba(255,255,255,0.05) + backdrop-blur(12px)` |
| `html.dark .text-gray-900` | `rgba(255,255,255,0.93)` |
| `html.dark .text-gray-600` | `rgba(255,255,255,0.60)` |
| `html.dark .border-gray-100`, `.border-gray-200` | `rgba(255,255,255,0.10)` |
| `html.dark .input` | `rgba(255,255,255,0.07)` bg + white text |

**Toggle Button** trong Header (desktop + mobile):
```jsx
<button onClick={toggleTheme}>
  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
</button>
```

### 5.3 Các Trang Mới

#### ChatPage (`/chat`) — Protected
Giao diện chatbot học bổng:
- Bubble UI phân biệt user (phải) / bot (trái)
- Hỗ trợ Markdown trong response của bot
- Load lịch sử chat khi mở trang
- Typing indicator khi chờ response
- Auto-scroll xuống tin nhắn mới nhất

#### NewsPage (`/news`) — Public
Tổng hợp tin tức giáo dục:
- Grid 3 cột, mỗi card có ảnh thumbnail, tiêu đề, mô tả, nguồn
- Filter theo danh mục (Tất cả / Học bổng / Du học / Visa / Giáo dục)
- Badge màu theo danh mục
- Skeleton loading state

#### RecommendPage (`/recommend`) — Protected
Gợi ý học bổng AI cá nhân hoá:
- Hiển thị profile hiện tại của user (GPA, IELTS, ngành, quốc gia mục tiêu)
- Nút "Xem gợi ý học bổng" → gọi `/api/recommend`
- Hiển thị danh sách học bổng với điểm match và lý do từ Gemini
- Skeleton loading + error state

#### AdminUsersPage (`/admin/users`) — Admin Only
Quản lý người dùng:
- Bảng danh sách user: tên, email, role, ngày đăng ký
- Search theo email/tên (submit form)
- Filter theo role (Tất cả / User / Admin)
- Toggle role: nâng lên Admin (Shield icon) / hạ xuống User (ShieldOff icon) với confirm dialog
- Pagination với ChevronLeft/ChevronRight

### 5.4 Cải tiến Trang Hiện có

**Header** — thêm:
- Dark/light toggle button (Sun/Moon icon)
- Link "Admin" hiện khi `user.role === 'admin'`
- `dark:` Tailwind variants toàn bộ

**ScholarshipCard** — thêm:
- Compare button (GitCompare icon) — thêm vào ComparisonStore
- Save button (Heart icon) — toggle saved với animation
- Accent gradient bar màu theo quốc gia

**ComparisonPage** (`/compare`) — so sánh tối đa 3 học bổng:
- Bảng so sánh ngang theo: quốc gia, bậc học, giá trị, deadline, điều kiện
- Sticky header khi scroll
- ComparisonBar nổi ở dưới màn hình khi đang so sánh

**ApplicationDetailPage** — cải tiến:
- Checklist items dạng toggle (checkbox animated)
- Status timeline (draft → submitted → under_review → interview → accepted/rejected)
- Edit inline cho notes

**LatestNewsSection** — widget tin tức trên HomePage:
- Lấy 4 tin mới nhất từ `/api/news`
- Mini-card compact, link ra nguồn gốc

### 5.5 Routing & Auth

**`ProtectedRoute`** thêm `requireAdmin` prop:
```jsx
<Route path="admin/users" element={
  <ProtectedRoute requireAdmin>
    <AdminUsersPage />
  </ProtectedRoute>
} />
```

**Routes mới thêm vào `App.jsx`**:
- `/chat` — ChatPage (Protected)
- `/news` — NewsPage (Public)
- `/compare` — ComparisonPage (Public)
- `/admin/users` — AdminUsersPage (Admin only)

---

## 6. Tích hợp Hai Nhánh

### 6.1 Chiến lược

Hai nhánh song song được phát triển độc lập:

| Nhánh | Điểm mạnh |
|-------|-----------|
| `fix/seed-and-ui` | OOP backend hoàn chỉnh, bug fixes middleware, seed script mới |
| `feat/ai-recommend-ui-improvements` | Light theme design system, ChatPage, NewsPage, RecommendPage |

Thay vì merge trực tiếp (70+ file conflict), áp dụng chiến lược **selective checkout**:

### 6.2 Các Bước Thực hiện

**Bước 1** — Chuẩn bị frontend trên `feat/ai-recommend-ui-improvements`:
- Thêm dark mode toggle (AuroraBackground, uiStore, main.jsx, Header)
- Port AdminUsersPage từ `fix/seed-and-ui`
- Tạo `useAdmin.js` hook, `adminService`
- Commit & push

**Bước 2** — Từ `fix/seed-and-ui`, kéo toàn bộ frontend:
```bash
git checkout fix/seed-and-ui
git checkout origin/feat/ai-recommend-ui-improvements -- frontend/
```
Kết quả: backend OOP của `fix/seed-and-ui` + toàn bộ frontend mới

**Bước 3** — Thêm chat + news backend vào `fix/seed-and-ui`:
```bash
git checkout origin/feat/ai-recommend-ui-improvements -- \
  backend/src/controllers/chat.controller.js \
  backend/src/services/chat.service.js \
  backend/src/routes/chat.routes.js \
  backend/src/controllers/news.controller.js \
  backend/src/services/news.service.js \
  backend/src/routes/news.routes.js
```
- Fix `chat.service.js`: thay Supabase client bằng `db.js` (pg)
- Đăng ký routes trong `app.js`

**Bước 4** — Tạo nhánh kết quả:
```bash
git checkout -b feat/full-stack-merge
git push -u origin feat/full-stack-merge
```

### 6.3 Kết quả

Nhánh `feat/full-stack-merge` có đầy đủ:

| Thành phần | Nguồn | Trạng thái |
|-----------|-------|-----------|
| Backend OOP 3-layer (7 modules) | `fix/seed-and-ui` | ✅ |
| Admin module (gold standard) | `fix/seed-and-ui` | ✅ |
| EventBus + Listeners | `fix/seed-and-ui` | ✅ |
| Middleware fixes | `fix/seed-and-ui` | ✅ |
| Chat backend (`/api/chat`) | `feat/ai-...` + fix pg | ✅ |
| News backend (`/api/news`) | `feat/ai-...` | ✅ |
| Light theme design system | `feat/ai-...` | ✅ |
| Dark mode Aurora toggle | `feat/ai-...` | ✅ |
| ChatPage, NewsPage | `feat/ai-...` | ✅ |
| RecommendPage (Gemini AI) | `feat/ai-...` | ✅ |
| AdminUsersPage | `fix/seed-and-ui` | ✅ |
| Seed script nâng cấp | `fix/seed-and-ui` | ✅ |

---

## 7. Cấu trúc Thư mục Cuối cùng

```
backend/src/
├── controllers/         # 9 modules (auth, scholarship, profile, document,
│                        #   application, saved, recommend, chat, news, admin)
├── routes/              # Express routes tương ứng
├── middlewares/         # auth.js, requireRole.js, validate.js,
│                        #   errorHandler.js, rateLimiter.js, upload.js
├── repositories/        # 8 repos (base + 7 domain) — chỉ có SQL ở đây
├── services/            # 10 services — business logic, không có SQL
├── events/              # eventBus.js + listeners/auth + listeners/storage
├── utils/               # db.js, AppError.js, responseHelper.js,
│                        #   validators.js, swagger.js, helpers.js
├── app.js               # Express setup + route registration
├── server.js            # Entry point
└── container.js         # DI container

frontend/src/
├── components/
│   ├── landing/         # AuroraBackground.jsx, Hero.jsx, Features.jsx
│   └── ui/              # 10 UI components (Card, Button, Input, Modal...)
├── pages/               # 14 trang + admin/AdminUsersPage
├── hooks/               # useAuth, useScholarship, useProfile, useApplication,
│                        #   useRecommend, useAdmin, useNews
├── services/            # api.js (Axios + interceptors), index.js, newsService.js
├── stores/              # authStore, comparisonStore, uiStore (Zustand)
└── utils/               # helpers.js, constants.js
```

---

## 8. Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Frontend | React 18, Vite, React Router v6, TanStack Query v5, Zustand, Axios, TailwindCSS 3 |
| Backend | Node.js ≥18, Express 4, PostgreSQL (pg Pool), JWT, bcryptjs, Zod, Swagger |
| AI | Google Gemini API (`gemini-2.0-flash`) — recommend + chatbot |
| News | RSS Parser — 4 nguồn giáo dục |
| Database | PostgreSQL 15 — local Docker / Supabase Cloud |
| Deploy | Vercel (FE), Railway (BE) |

---

## 9. Hướng dẫn Chạy Dự án

```bash
# 1. Database
docker-compose up -d

# 2. Chạy migration chat_messages (nếu chưa có)
psql $DATABASE_URL -f database-chat-messages.sql

# 3. Backend
cd backend
cp .env.example .env   # điền PG_*, GEMINI_API_KEY, JWT_SECRET
npm install
npm run dev            # port 5000

# 4. Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev            # port 5173

# 5. Tạo admin user (lần đầu)
cd backend && npm run seed:admin

# 6. Seed học bổng
cd backend && npm run seed:cloud
```

---

## 10. Cải tiến Hiệu năng & Giao diện (17/05/2026 — session 2)

### 10.1 Code Splitting — React.lazy + Suspense

**Vấn đề:** Vite dev server load rất chậm ở lần đầu vì phải transform toàn bộ 14 trang cùng lúc khi khởi động.

**Giải pháp:** Chuyển tất cả 14 page imports sang `React.lazy()` và bọc `<Routes>` trong `<Suspense>`.

```jsx
// App.jsx — trước
import HomePage from './pages/HomePage';
import ScholarshipsPage from './pages/ScholarshipsPage';
// ...14 static imports

// Sau
const HomePage = lazy(() => import('./pages/HomePage'));
const ScholarshipsPage = lazy(() => import('./pages/ScholarshipsPage'));
// ...
<Suspense fallback={<PageFallback />}>
  <Routes>...</Routes>
</Suspense>
```

Kết quả: Vite chỉ transform trang hiện tại khi người dùng navigate đến, giảm thời gian khởi động đáng kể.

---

### 10.2 AuroraBackground — Tối ưu GPU

**Vấn đề:** 3 blob riêng biệt mỗi blob có `filter: blur(80-120px)` = 3 compositor layers trên GPU.

**Giải pháp:** Đơn giản hóa `AuroraBackground.jsx` thành nền tĩnh `bg-[#050510]` — loại bỏ hoàn toàn blur animations. Đồng thời xóa 3 `@keyframes aurora1/2/3` dead code khỏi `index.css`.

```jsx
// AuroraBackground.jsx — sau tối ưu
const AuroraBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050510]" />
);
```

---

### 10.3 Dark Mode UI Refresh — Aurora Purple Theme

Toàn bộ các section có gradient teal-blue (`from-slate-900 via-primary-900 to-sky-800`) được cập nhật để hiển thị đúng theo theme:

**Nguyên tắc:** `bg-gradient-to-r` đặt `background-image`, còn `dark:bg-[color]` chỉ đặt `background-color`. Trình duyệt render `background-image` đè lên `background-color`. Fix: dùng `dark:bg-none` để xóa gradient image + `dark:bg-transparent` để để aurora nền hiện qua.

**Các file đã sửa:**

| File | Thay đổi |
|------|---------|
| `pages/HomePage.jsx` | Hero section + CTA section: thêm `dark:bg-none dark:bg-transparent` |
| `pages/SavedPage.jsx` | Page header: thêm `dark:bg-none dark:bg-transparent` |
| `components/LatestNewsSection.jsx` | Hover rows: `dark:hover:bg-white/5`; group-hover title: `text-purple-400`/`text-purple-500` |
| `components/ScholarshipCard.jsx` | Title hover: `group-hover:text-purple-500 dark:group-hover:text-purple-400` |
| `index.css` | `html.dark .btn-primary` gradient tím-cyan; dark overrides cho skeleton, hover states |

**Kết quả theo theme:**
- **Light mode**: Giữ nguyên gradient teal-blue trên tất cả section headers
- **Dark mode**: Nền đen (`#050510`) từ AuroraBackground hiện qua; headline gradient tím-hồng-cyan; btn-primary gradient tím-cyan tự động qua CSS specificity

**Headline gradient (dark mode only):**
```jsx
<h1>
  <span className="dark:bg-gradient-to-r dark:from-purple-300 dark:via-pink-300 dark:to-cyan-300 dark:bg-clip-text dark:text-transparent">
    Cánh cửa đến học bổng quốc tế của bạn
  </span>
</h1>
```

**btn-primary dark gradient (index.css — áp dụng toàn cục):**
```css
html.dark .btn-primary {
  background-image: linear-gradient(to right, #9333ea, #06b6d4);
}
html.dark .btn-primary:hover {
  background-image: linear-gradient(to right, #a855f7, #22d3ee);
}
```

---

### 10.4 Dọn dẹp Dead Code

- **Xóa `AnimatedPage.jsx`**: Component import `framer-motion` (chưa cài), không được dùng ở đâu — xóa hoàn toàn tránh lỗi build
- **Xóa `@keyframes aurora1/2/3`** khỏi `index.css`: không còn tham chiếu sau khi AuroraBackground đơn giản hóa

---

*Cập nhật lần 2: 17/05/2026 — session performance + dark mode UI refresh*

---

## 11. Admin Dashboard — Tích hợp Giao diện & Bug Fixes (17/05/2026 — session 3)

### 11.1 Kéo Admin UI từ `feature/admin-dashboard`

Nhánh `feature/admin-dashboard` có bộ giao diện admin hoàn chỉnh chưa được tích hợp vào `feat/full-stack-merge`. Thực hiện `git checkout remotes/origin/feature/admin-dashboard` cho các file sau:

| File | Mô tả |
|------|-------|
| `frontend/src/pages/admin/AdminLayout.jsx` | Layout sidebar + mobile nav cho khu vực `/admin` |
| `frontend/src/pages/admin/AdminDashboardPage.jsx` | Dashboard thống kê: stat cards + 2 biểu đồ Recharts |
| `frontend/src/pages/admin/AdminScholarshipsPage.jsx` | Quản lý học bổng: CRUD + toggle featured |
| `frontend/src/pages/admin/AdminUsersPage.jsx` | Quản lý users: filter role/status, toggle role/trạng thái |
| `frontend/src/hooks/useAdmin.js` | TanStack Query hooks cho tất cả admin operations |
| `frontend/src/services/adminService.js` | Axios calls đến `/api/admin/*` |

**AdminDashboardPage** dùng `recharts` (đã có sẵn trong `package.json`):
- AreaChart: đăng ký mới theo tuần (12 tuần gần nhất)
- BarChart: đơn ứng tuyển theo trạng thái

**AdminLayout** có sidebar desktop (NavLink active highlight) và bottom navigation mobile.

### 11.2 Tích hợp Route — `App.jsx`

Thêm `AdminRoute` component và nested routes cho admin panel, tách biệt hoàn toàn khỏi `Layout` chính:

```jsx
// AdminRoute — check role 'admin' từ Zustand store
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

// Nested routes dưới /admin — dùng AdminLayout làm parent
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route index element={<AdminDashboardPage />} />
  <Route path="users" element={<AdminUsersPage />} />
  <Route path="scholarships" element={<AdminScholarshipsPage />} />
</Route>
```

Tất cả admin pages đều lazy-loaded qua `React.lazy()`.

### 11.3 Fix Import AuroraBackground

`AdminLayout.jsx` gốc dùng named import `{ AuroraBackground }` nhưng component chỉ có `export default`:

```jsx
// Trước (lỗi build)
import { AuroraBackground } from '../../components/landing/AuroraBackground';

// Sau
import AuroraBackground from '../../components/landing/AuroraBackground';
```

### 11.4 Cập nhật Header

Link "Admin" trên navbar (desktop + mobile) đổi từ `/admin/users` → `/admin` để vào thẳng Dashboard:

```jsx
// Header.jsx
<Link to="/admin">Admin</Link>   // trước: to="/admin/users"
```

### 11.5 Backend Bug Fixes — Admin Module

Trong quá trình debug lỗi "Không thể tải dữ liệu. Kiểm tra quyền admin.", phát hiện và sửa **4 bugs**:

**Bug 1 — `adminUserQuerySchema` reject `role=''` (400 Error)**

`z.enum(['user', 'admin']).optional()` từ chối empty string. Frontend gửi `role=''` khi "Tất cả role" được chọn → 400 Validation Error → users list không load.

```js
// validators.js — trước
role: z.enum(['user', 'admin']).optional(),

// Sau — dùng preprocess để coerce empty string → undefined
role: z.preprocess(v => (v === '' ? undefined : v), z.enum(['user', 'admin']).optional()),
status: z.preprocess(v => (v === '' ? undefined : v), z.enum(['active', 'inactive']).optional()),
```

**Bug 2 — `findUsers` logic conflict `is_active`**

`conditions` khởi tạo với `['is_active = true']` hardcoded, sau đó nếu filter `status=inactive` thêm `is_active = false` → `WHERE is_active = true AND is_active = false` → 0 kết quả.

```js
// admin.repository.js — sau fix
const conditions = [];
if (status !== undefined) {
  conditions.push(`is_active = $${idx++}`);
  params.push(status === 'active');
} else {
  conditions.push('is_active = true');  // default
}
```

**Bug 3 — Missing `PATCH /admin/users/:id/status` endpoint**

`useUpdateUserStatus` hook (trong `AdminUsersPage`) gọi endpoint này nhưng không tồn tại trên backend. Đã thêm đầy đủ theo OOP pattern:

- `admin.repository.js`: thêm `updateUserStatus(id, isActive)`
- `admin.service.js`: thêm `changeUserStatus(targetUserId, isActive, adminId)` với self-lockout guard
- `admin.controller.js`: thêm `updateUserStatus` handler
- `admin.routes.js`: thêm `PATCH /users/:id/status` + `validate(adminUpdateUserStatusSchema)`
- `validators.js`: thêm `adminUpdateUserStatusSchema = z.object({ isActive: z.boolean() })`

### 11.6 Database Migration — `is_active` Column

**Root cause của stats lỗi:** Cột `is_active` chưa tồn tại trên bảng `users` trong Supabase Cloud. `admin.repository.js` query `WHERE is_active = true` → PostgreSQL throw `column "is_active" does not exist` → 500 response → frontend hiện "Kiểm tra quyền admin".

`database.sql` chỉ có base schema; `role` và `last_login_at` đã được add trực tiếp vào Supabase khi dev auth module nhưng `is_active` bị bỏ sót.

**Tạo migration** `backend/scripts/migrations/002_add_user_columns.sql`:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role          VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
```

**Chạy migration trực tiếp** qua pg connection (Node.js script, không cần Supabase Dashboard):
- Kết quả: 22 users hiện tại đều được set `is_active = true` (DEFAULT)
- Verify: `SELECT COUNT(*) FROM users WHERE is_active = true` → 22 ✅

### 11.7 Kết quả

Sau migration + restart backend:
- `/admin` → Dashboard load stat cards + biểu đồ Recharts
- `/admin/users` → Danh sách 22 users với filter role/status hoạt động
- `/admin/scholarships` → CRUD học bổng hoạt động
- `PATCH /admin/users/:id/status` → Toggle active/inactive user hoạt động

---

*Cập nhật lần 3: 17/05/2026 — admin dashboard integration + DB migration*
