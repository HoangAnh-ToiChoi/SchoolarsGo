# ScholarsGo — Quy ước dự án

Nền tảng tìm học bổng cho sinh viên Việt Nam. File này là **nguồn quy ước duy nhất** cho người và AI.

**Stack:** React 18 + Vite, Tailwind 3, shadcn/ui, Redux Toolkit, TanStack Query (FE) · Node.js (ESM) + Express 5, Supabase PostgreSQL (BE) · GitHub Pages (demo FE)

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
| service | 200 | model | 250 |

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
npm run test:contract     # test service với model giả, không cần DB
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
  → models/        chỉ truy vấn DB (Supabase client hoặc pg). Không nghiệp vụ
```

Vi phạm ranh giới → sửa trước khi merge. (`chat.service` còn gọi thẳng Supabase: cần tách `chat.model`.)

**Mỗi file class xuất sẵn một bản dùng chung, không có container, không `this` cho phụ thuộc.** Cuối file model / service / controller chỉ có `export default new SavedService();` (không `export { Class }`, không constructor nhận phụ thuộc). Nơi dùng `import savedService from '#services/saved.service.js'` rồi gọi thẳng. Service gọi model đã import (`savedModel.findAllByUser(...)`); model gọi `getSupabase()` trong từng hàm. `this` chỉ còn cho trạng thái riêng của chính class (cache, parser) và hàm private. Bản dùng chung chạy ngay lúc import nên cần `.env` đã nạp (`import 'dotenv/config'` là dòng đầu của `app.js`, `server.js`). Không dùng event bus: việc gì cần làm thì gọi thẳng trong service.

**ESM + Express 5.** `package.json` có `"type": "module"`: dùng `import` / `export` (có đuôi `.js`), không `require` / `module.exports`. Nhiều hàm xuất `export { a, b }`. **Import nội bộ dùng `#` (= `backend/src/`), không dùng `../`**: `import AppError from '#utils/AppError.js'`; cùng thư mục thì `./`. Đây là `imports` có sẵn của Node (khai báo trong `package.json`), chạy thẳng không cần cờ hay file phụ; `jsconfig.json` chỉ để VS Code gợi ý và nhảy tới file. Node không cho dùng `~/` hay `#/`. `__dirname` lấy bằng `path.dirname(fileURLToPath(import.meta.url))`. `import` chạy trước code của file: đặt biến môi trường rồi mới nạp module cần nó thì dùng `await import()`. Express 5: `req.query` chỉ đọc (`validate` đã xử lý), `req.body` luôn là object (`app.js`).

### Cấu trúc

```
backend/
  src/
    server.js            mở cổng + bật cron (jobs/)
    app.js               middleware chung (helmet, cors, cookie, rate limit) + gắn routes
    routes/ controllers/ services/ models/   một file mỗi nhóm: notification.routes.js …
                         routes/index.js tự nạp mọi *.routes.js, tên file thành đường dẫn (saved.routes.js → /saved)
    middlewares/         auth (auth, optionalAuth), requireRole, validate, upload, rateLimiter, errorHandler
    jobs/                tự nạp, gọi mọi hàm start*: nhắc hạn 7:00, kéo học bổng Chủ nhật 2:00, tắt học bổng quá hạn 3:00
    ingestion/           module kéo học bổng — tự chứa, đọc index.js trước
    configs/             CORS, database, JWT, nodemailer, Supabase client, error.config (đổi lỗi → response)
    validations/         schema zod theo nghiệp vụ: auth.validation.js …
    utils/               AppError, responseHelper, helpers
  scripts/migrations/    00N_tenMigration.sql — đánh số tăng dần, chạy lại nhiều lần không lỗi
  tests/contracts/       test service · tests/ingestion/ test module kéo học bổng
```

### Phân quyền

- **Đăng nhập:** `auth` (bắt buộc) hoặc `optionalAuth` (có thì đọc) → `req.user = { id, sid, role }`. Token nằm trong cookie httpOnly.
- **Admin:** `router.use(auth, requireRole('admin'))` ở đầu file route.
- **Dữ liệu của người dùng** (đơn, đã lưu, thông báo, tài liệu): model **luôn lọc theo `user_id`** (`findByIdAndUser(id, userId)`). Không thấy → **404** (không báo 403, để không lộ là bản ghi tồn tại).
- Cấu hình môi trường / CORS đặt trong `backend/src/configs/`; mã lỗi và thông báo chuẩn đặt trong `backend/src/constants/errors.js` (ví dụ `authorization.ACCESS_TOKEN_EXPIRED`). Không đặt cấu hình trong `utils/` và không tự gõ lại mã lỗi.
- Access token sống 15 phút; refresh token 7 ngày, lưu dạng hash trong `user_sessions`. LocalStorage FE chỉ được giữ `{ full_name, avatar_url }`; quyền admin luôn lấy từ `/auth/me`.
- Hàm bất đồng bộ trong backend và frontend dùng `async function`; method trong class dùng `async methodName(...) {}`. Không dùng async arrow function hoặc gán function vào class field.

### Lỗi và response

- **Controller không `try/catch/next`.** Express 5 tự chuyển lỗi của handler `async` sang `errorHandler`. Handler chỉ có 2 tham số `(req, res)`.
- **Ném lỗi nghiệp vụ** bằng hàm tạo sẵn của `AppError`: `AppError.badRequest | unauthorized | forbidden | notFound | conflict | internal(message, 'MA_LOI')`. Mã dựng sẵn (đăng nhập, phiên) dùng `new AppError(authorization.X)`. Status không có hàm tạo (vd. 503) dùng `new AppError(message, 503, 'MA_LOI')`.
- `errorHandler` → `resolveError()` (`configs/error.config.js`) đổi mọi lỗi (zod, Postgres, JWT, multer, JSON hỏng, `AppError`, lỗi lạ) thành `{ statusCode, code, errorCode, message, details }`. Lỗi lạ trả 500 chung chung, không lộ chi tiết. Thêm kiểu lỗi mới = thêm một mapper ở đó.
- **Dạng response** (`ApiResponse` trong `utils/responseHelper.js`): thành công `{ success, data, message, meta }` qua `success(res, …)` / `created(res, …)`; lỗi `{ success: false, message, code, error, errors? }`. `code` (số HTTP hoặc mã chữ như `SESSION_REVOKED`) và `errors` là thứ FE đang đọc, **không đổi tên / bỏ**. `error` là mã chuẩn UPPER_SNAKE_CASE. Mọi response lỗi (kể cả 404, giới hạn tần suất, upload) tạo bằng `ApiResponse.error`, không tự viết JSON.
- Đầu vào kiểm tra bằng zod trong `validations/<nghiệpVụ>.validation.js`, gắn ở route qua `validate(schema, 'query' | 'body' | 'params')`. Sai → `ZodError` → 400 `VALIDATION_ERROR` kèm `errors` từng trường.

### Query

- Chọn cột cụ thể, không `SELECT *` / `select('*')`.
- Không N+1: dùng JOIN / select lồng (`scholarships(id, title)`) hoặc `Promise.all`.
- Lọc theo cột mới → kiểm tra đã có index, chưa có thì thêm trong migration.
- **Lấy dữ liệu 2 bước: SQL lấy nhẹ → code lọc → rồi mới lấy dữ liệu đầy đủ theo kết quả lọc.** Khi điều kiện lọc không viết được gọn bằng SQL (tính điểm, so khớp hồ sơ, xếp hạng, luật nghiệp vụ):
  1. Model chạy SQL chỉ lấy cột cần để lọc (`id` + vài cột điều kiện), không kéo cả bản ghi.
  2. Service lọc / chấm điểm / sắp xếp bằng code, cắt phân trang trên danh sách `id` đã lọc.
  3. Model lấy bản ghi đầy đủ chỉ cho các `id` còn lại (`.in('id', ids)` / `WHERE id = ANY($1)`), một lần, rồi service ghép lại theo đúng thứ tự đã xếp.
  Điều kiện SQL viết được gọn (bằng, khoảng, `ILIKE`, theo `user_id`…) thì để SQL lọc luôn, không cần 2 bước.
- Thời gian theo giờ Việt Nam (`Asia/Ho_Chi_Minh`) khi tính "hôm nay", "còn N ngày".

### Test

Mỗi hàm service mới có test: trường hợp đúng, đầu vào sai, không tìm thấy. Vì service import thẳng model, test giả lập module bằng `tests/contracts/helpers/mockService.js` (`mockService`, `mockSupabase`) **trước** khi `await import()` service; mỗi test gán `ref.current` = model giả (object có cùng tên hàm), không gọi DB thật. `tests/setupEnv.js` đặt biến môi trường giả. Test lỗi / response: `tests/contracts/errorResponse.contract.test.js`.

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
