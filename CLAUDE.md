# ScholarsGo — Quy ước dự án

Nền tảng tìm học bổng cho sinh viên Việt Nam. File này là **nguồn quy ước duy nhất** cho người và AI.

**Stack:** React 18 + Vite, Tailwind 3, shadcn/ui, Redux Toolkit, TanStack Query (FE) · Node.js + Express, Supabase PostgreSQL (BE) · GitHub Pages (demo FE)

**Tài liệu:** `docs/roadmap.md` (việc của từng vai trò FE/BE/AI) · `docs/api.md` · `docs/database.md` · `docs/scholarshipIngestion/` (module kéo học bổng). Tài liệu lệch code thì **code là đúng**.

---

## Quy trình

1. **Làm rõ yêu cầu.** Mơ hồ → hỏi trước. Rõ → làm luôn.
2. **Tạo nhánh từ `dev`:** `feat/…`, `fix/…`, `refactor/…`, `docs/…`.
3. **Làm từng phần:** viết → tự review → kiểm tra checklist → test → commit `feat|fix|refactor|style|docs: mô tả ngắn`.
4. **Pull Request vào `dev`:** ít nhất 1 người review, lint + build + test phải qua. Không commit thẳng `main`, không commit `.env`, khóa API, dữ liệu cá nhân.

### Checklist trước khi báo xong

```
□ Số dòng: file vừa sửa/tạo có vượt ngưỡng (bảng dưới)? → tách trước
□ BE route mới: có auth / requireRole? dữ liệu của người dùng có lọc theo user_id?
□ BE query: không SELECT * · không await trong vòng lặp (N+1) · đọc song song dùng Promise.all
□ BE service mới: có test trong backend/tests/
□ FE màn hình: đủ 4 trạng thái — đang tải (skeleton), rỗng, lỗi (có nút thử lại), có dữ liệu
□ FE: kiểm tra 360 / 768 / 1024 / 1280px, không cuộn ngang
□ Không còn console.log, import thừa, code bị comment
```

### Giới hạn số dòng (vượt → tách)

| FE | | BE | |
|---|---|---|---|
| component | 200 | controller | 100 |
| hook | 150 | service | 200 |
| service | 200 | repository | 250 |

File cũ đang vượt — tách khi sửa tới, để file sạch hơn lúc mở ra:
- BE: `admin.controller`, `admin.service`, `chat.service`, `recommend.service`
- FE: trang `chat`, `dashboard`, `profile`, `admin/scholarships`, `admin/users` (đều là trang legacy chờ làm lại)

### Viết code (chung FE + BE)

- **Đơn giản trước.** Không thêm lớp trừu tượng, thư mục con, file `index.js` re-export khi chưa có ≥ 3 chỗ dùng. Tên file nói rõ việc nó làm.
- **Tên do dự án đặt đều `camelCase`:** thư mục, file, route (`/forgotPassword`), endpoint, class CSS tự định nghĩa. Giữ tên do thư viện áp đặt (class Tailwind, tên gói npm, `README.md`…). Component `PascalCase` · hook `useXxx` · hằng số `UPPER_SNAKE` · biến môi trường FE `VITE_UPPER_SNAKE`.
- **Comment tiếng Việt**, chỉ giải thích *vì sao* hoặc quy tắc nghiệp vụ; không comment điều hiển nhiên. Không để code chết.
- Không bắt lỗi cho trường hợp không thể xảy ra.

---

## Lệnh

```bash
# frontend/
npm run dev           # chạy local, gọi API theo VITE_API_BASE_URL trong .env.local
npm run lint          # 0 lỗi
npm run build         # build được
npm run build:pages   # bản demo GitHub Pages (dữ liệu minh họa)

# backend/
npm run dev               # nodemon src/server.js
npm run lint              # 0 lỗi
npm run test:contract     # test service với repository giả, không cần DB
npm run test:ingestion    # test module kéo học bổng, không cần mạng, không cần DB
npm run ingest:dry        # chạy thử kéo học bổng, không ghi DB
```

Demo: đẩy `frontend/dist/` (sau `build:pages`) lên nhánh `gh-pages` → https://hoanganh-toichoi.github.io/SchoolarsGo/

---

## Backend

### Luồng một request

```
routes/        URL + middleware: auth, requireRole, validate(schema)
  → controllers/   đọc req → gọi service → trả res. Không nghiệp vụ, không gọi DB
  → services/      nghiệp vụ (luật chuyển trạng thái đơn, mốc nhắc hạn…). Không gọi DB client trực tiếp
  → repositories/  chỉ truy vấn DB (Supabase client hoặc pg). Không nghiệp vụ
```

Vi phạm ranh giới → sửa trước khi merge. (`chat.service` còn gọi thẳng Supabase: cần tách `chat.repository`.)

**`src/container.js`** là nơi duy nhất `new` repository → service → controller và truyền vào nhau qua constructor. Route lấy controller từ container. Module mới: **thêm một khối**, không sửa khối của module khác. Nhờ vậy test đưa được repository giả vào service.

### Cấu trúc

```
backend/
  src/
    server.js            mở cổng + bật cron (jobs/)
    app.js               middleware chung (helmet, cors, cookie, rate limit) + gắn routes
    container.js         lắp các tầng
    routes/ controllers/ services/ repositories/   một file mỗi nhóm: notification.routes.js …
    middlewares/         auth (auth, optionalAuth), requireRole, validate, upload, rateLimiter, errorHandler
    jobs/                cron: nhắc hạn 7:00, kéo học bổng Chủ nhật 2:00, tắt học bổng quá hạn 3:00
    ingestion/           module kéo học bổng — tự chứa, đọc index.js trước
    events/              eventBus + listeners
    config/               env, CORS and Supabase client configuration
    utils/               AppError, responseHelper, validators (zod), db (pg)
  scripts/migrations/    00N_tenMigration.sql — đánh số tăng dần, chạy lại nhiều lần không lỗi
  tests/contracts/       test service · tests/ingestion/ test module kéo học bổng
```

### Phân quyền

- **Đăng nhập:** `auth` (bắt buộc) hoặc `optionalAuth` (có thì đọc) → `req.user = { id, sid, role }`. Token nằm trong cookie httpOnly.
- **Admin:** `router.use(auth, requireRole('admin'))` ở đầu file route.
- **Dữ liệu của người dùng** (đơn, đã lưu, thông báo, tài liệu): repository **luôn lọc theo `user_id`** (`findByIdAndUser(id, userId)`). Không thấy → **404** (không báo 403, để không lộ là bản ghi tồn tại).
- Cấu hình môi trường / CORS đặt trong `backend/src/config/`; mã lỗi và thông báo chuẩn đặt trong `backend/src/constants/errors.js` (ví dụ `authorization.ACCESS_TOKEN_EXPIRED`). Không đặt cấu hình trong `utils/` và không tự gõ lại mã lỗi.
- Access token sống 15 phút; refresh token 7 ngày, lưu dạng hash trong `user_sessions`. LocalStorage FE chỉ được giữ `{ full_name, avatar_url }`; quyền admin luôn lấy từ `/auth/me`.
- Hàm bất đồng bộ trong backend và frontend dùng `async function`; method trong class dùng `async methodName(...) {}`. Không dùng async arrow function hoặc gán function vào class field. `container.js` bind controller method trước khi truyền cho Express.

### Lỗi và response

- Service ném `new AppError(message, statusCode, 'MA_LOI')`. Controller `try { … } catch (err) { next(err) }` → `errorHandler` trả JSON.
- Thành công: `success(res, data, message, meta)` / `created(…)` trong `utils/responseHelper.js` → `{ success, data, message, meta }`.
- Đầu vào kiểm tra bằng zod trong `utils/validators.js`, gắn ở route qua `validate(schema, 'query' | 'body' | 'params')`.

### Query

- Chọn cột cụ thể, không `SELECT *` / `select('*')`.
- Không N+1: dùng JOIN / select lồng (`scholarships(id, title)`) hoặc `Promise.all`.
- Lọc theo cột mới → kiểm tra đã có index, chưa có thì thêm trong migration.
- Thời gian theo giờ Việt Nam (`Asia/Ho_Chi_Minh`) khi tính "hôm nay", "còn N ngày".

### Test

Mỗi hàm service mới có test: trường hợp đúng, đầu vào sai, không tìm thấy. Dùng repository giả (object có cùng tên hàm), không gọi DB thật.

---

## Frontend

```
frontend/src/
  App.jsx, main.jsx      router (trang tải lười) · Provider Redux + React Query + Router
  pageLoaders.js         hàm tải từng trang + tải trước khi rảnh (thêm trang mới: thêm vào đây)
  pages/<trang>/index.jsx       chỉ ghép component, không gọi API · components/ riêng của trang · helper.js
  layouts/               userLayout, adminLayout: index.jsx để dùng, components/ là phần triển khai
  components/  ui/ (shadcn) · common/ (pageHeader, backLink, pagination, reveal, slowLoading)
               application/ · scholarship/ · scholarshipFilter/ · legacy/ (UI cũ, code mới không dùng)
  hooks/                 TanStack Query + logic dùng lại     services/<nhóm>.service.js   gọi API qua utils/apiClient
  store/slices/          Redux: auth, comparison, ui         utils/   cn, format, scholarship, application, security, palette, demo/
```

- Mỗi trang / component / layout là **một thư mục có `index.jsx`**. Import bằng `~/`, không `../`.
- Một trang dùng → `pages/<trang>/components/`. Hai trang trở lên → `components/`. Tính toán một trang dùng → `helper.js` cạnh trang; nơi thứ hai cần → `utils/`.
- Thứ tự import: thư viện ngoài → `~/layouts`, `~/components` → `~/hooks` → `~/utils`, `~/store`, `~/services`.
- Component: `export default function Ten()`; riêng `components/ui/` giữ named export kiểu shadcn.

| Dữ liệu | Đặt ở |
|---|---|
| Từ server | TanStack Query trong `hooks/` gọi `services/`, không gọi axios trong component |
| Toàn cục (giao diện, phiên đăng nhập) | Redux, đọc bằng selector `selectXxx`. **Không lưu token** |
| Từ khóa + bộ lọc | URL trang chủ qua `useScholarshipFilters()` |
| Cục bộ | `useState` |

- Chuyển trang không nháy: `Suspense` quanh `<Outlet />` trong layout, router bật `v7_startTransition`.
- Tải quá 5 giây → `SlowLoading`. `Reveal` chỉ chạy khi đã có dữ liệu, tôn trọng `prefers-reduced-motion`.
- **XSS:** không `dangerouslySetInnerHTML` (bắt buộc thì qua `sanitizeHtml()`); URL từ dữ liệu qua `safeUrl()`; link tab mới có `rel="noopener noreferrer"`.
- **Accessibility:** thẻ thật (`<button>`, `<a href>`, `<label>`); nút chỉ có icon có `aria-label`; icon trang trí `aria-hidden`; có hover và focus nhìn thấy được.

### Thiết kế

**Chỉ 5 màu**, khai báo duy nhất trong `src/index.css`: primary #4F46E5 (nút chính, liên kết, "Du học") · neutral #3F3F46 (chữ, viền, "Trong nước") · success #067647 (hạn > 30 ngày) · warning #B54708 (hạn 11–30 ngày) · danger #B42318 (hạn ≤ 10 ngày, lỗi, xóa).

- Component **không viết mã màu** (`#…`, `text-blue-500`): dùng token `brand-600`, `heading`, `fg`, `fg-muted`, `line`, `canvas`, `hover`, `urgent`/`soon`/`open`, `abroad`/`domestic`. Màu trong JS → `color()` ở `utils/palette.js`. Chưa làm chế độ tối.
- **Bố cục:** header 64px (logo | tìm kiếm ở giữa | chuông + tài khoản), sidebar 256px `sticky`, lề nội dung `p-4 sm:p-6 lg:p-8`. Dưới `lg`: sidebar thành menu trượt (`Sheet`).
- **Thông báo** không có trang riêng: bấm chuông sổ danh sách (`notificationMenu`).
- **Tìm kiếm:** một thanh duy nhất trên header, kết quả ở trang chủ. Chi tiết học bổng `/scholarships/:slug` (tạo bằng `scholarshipPath()`).
- **Danh sách học bổng** dùng `ScholarshipGrid` + `ScholarshipCard`; danh sách đơn dùng dạng dòng (học bổng | giấy tờ | trạng thái).
- **Trang chi tiết** gói trong một màn hình 1280×800: đầu trang (tên, nhãn, hành động bên phải) + cột chính | cột phụ `sticky`.
- **Nút quay lại** luôn dùng `BackLink`, nhãn ghi tên trang sẽ về ("Đơn ứng tuyển"), không ghi "Quay lại".
- Mỗi vùng chỉ 1 nút chính (nền tím). Nhãn luôn mang nghĩa; hạn nộp dùng `getDeadlineInfo()` (ngưỡng 10 và 30 ngày).
- Lưới `auto-fill` + `minmax(min(Npx,100%),1fr)`; chữ không tràn (`min-w-0`, `truncate`). Lỗi lặp nhiều nơi → sửa ở component gốc.
- **Kích thước:** điều khiển 40px · mục sidebar 38px · bo góc thẻ 14px, ô con 10px, nút 8px · khoảng cách bội số 4.
- **Chữ:** Be Vietnam Pro · tiêu đề trang 24 · tiêu đề thẻ 17 · tiêu đề khối 15 · thân 13–14 · nhãn 11.5–12.
- Icon Heroicons solid. Chuyển động 150–220ms. Không gradient, không emoji trang trí.
