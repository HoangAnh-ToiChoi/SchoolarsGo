# ScholarsGo — Quy ước dự án

Nền tảng tìm học bổng cho sinh viên Việt Nam. File này là **nguồn quy ước duy nhất** cho người và AI.

| | |
|---|---|
| **Frontend** | React 18 + Vite, Tailwind 3, shadcn/ui, Redux Toolkit, TanStack Query |
| **Backend** | Node.js (ESM) + Express 5, Supabase PostgreSQL |
| **Demo** | GitHub Pages (chỉ FE) |
| **Tài liệu** | `docs/frontendRules/frontendRules.md` (quy tắc FE bắt buộc R1–R11; **sửa lỗi xong phải ghi thành quy tắc ở đó**) · `docs/roadmap.md` (việc từng vai trò) · `docs/api.md` · `docs/database.md` · `docs/scholarshipIngestion/` · `docs/harness.md` (hook, agent, lệnh `/verify` `/review-diff`… của Claude Code) |

Tài liệu lệch code thì **code là đúng**.

**Mục lục:** [1. Quy trình](#1-quy-trình-làm-việc) · [2. Quy ước chung](#2-quy-ước-code-chung) · [3. Lệnh](#3-lệnh) · [4. Backend](#4-backend) · [5. Frontend](#5-frontend)

---

## 1. Quy trình làm việc

### 1.1 Từ yêu cầu đến `dev`

1. **Làm rõ yêu cầu.** Mơ hồ → hỏi trước. Rõ → làm luôn.
2. **Tạo nhánh từ `dev`:** `feat/…`, `fix/…`, `refactor/…`, `docs/…`.
3. **Làm từng phần:** viết → tự review → checklist → test → commit `feat|fix|refactor|style|docs: mô tả ngắn`.
4. **Đưa vào `dev`:** commit trên nhánh → push nhánh → **từ nhánh đó** `git merge --no-ff <nhánh>` vào `dev` → push `dev`. Lint + build + test phải qua.

**Cấm:** commit / merge thẳng trên `dev` · force-push `dev` · commit thẳng `main` · commit `.env`, khóa API, dữ liệu cá nhân.

### 1.2 Làm đúng việc được giao (người và AI)

| Người dùng nói | Được làm | **Không** được làm |
|---|---|---|
| "review / đánh giá / kiểm tra / quét" | Đọc, chạy lệnh đọc (`grep`, lint, build), báo kết quả và đề xuất | **Sửa code.** Muốn sửa thì **hỏi trước** và chờ đồng ý |
| "tạo file / viết tài liệu .md" | Chỉ tạo / sửa đúng file tài liệu đó | Sửa code, tách file, đổi cấu trúc "tiện tay" |
| "sửa / làm / áp dụng" | Sửa đúng phạm vi được nêu | Mở rộng sang trang hoặc việc khác chưa được nhắc |

- Việc khó hoàn tác (hoàn tác code, xóa, push, merge) chỉ làm khi được yêu cầu rõ. Đổi nhiều file thì **cất bằng `git stash`** thay vì xóa.
- Trả lời **ngắn, đúng ngay lần đầu**: kết luận trước, ví dụ React hoặc bảng nhỏ; bản dài chỉ khi được yêu cầu.

### 1.3 Checklist trước khi báo xong

```
□ File vừa sửa/tạo vượt ngưỡng số dòng? → tách trước
□ FE: đối chiếu frontendRules (R1–R11), ghi lỗi vừa sửa vào "Nhật ký quy tắc"; không còn helper.js / constants.js / useXxx.js lẻ ở gốc trang
□ FE màn hình: đủ 4 trạng thái (skeleton, rỗng, lỗi có nút thử lại, có dữ liệu) · 360 / 768 / 1024 / 1280px không cuộn ngang
□ BE route mới: auth / requireRole? dữ liệu người dùng lọc theo user_id?
□ BE query: không SELECT * · không await trong vòng lặp (N+1) · đọc song song dùng Promise.all · service mới có test
□ Không còn console.log, import thừa, code bị comment
```

### 1.4 Giới hạn số dòng (vượt → tách)

| Loại | Tối đa | | Loại | Tối đa |
|---|---|---|---|---|
| FE component | 200 | | BE controller | 100 |
| FE hook | 150 | | BE service | 200 |
| FE service | 200 | | BE model | 250 |

File cũ đang vượt, tách khi sửa tới: **BE** `admin.controller`, `admin.service`, `chat.service`, `recommend.service` · **FE (trang legacy)** `chat`, `dashboard`, `profile`, `admin/scholarships`, `admin/users`.

---

## 2. Quy ước code chung

Áp dụng cho cả FE và BE.

- **Đơn giản trước.** Không thêm lớp trừu tượng, thư mục con, `index.js` re-export khi chưa có ≥ 3 chỗ dùng (ngoại lệ: `hooks/ helpers/ constants/` của trang FE). Tên file nói rõ việc nó làm.
- **Đặt tên:** tên do dự án đặt đều `camelCase` (thư mục, file, route `/forgotPassword`, endpoint, class CSS tự định nghĩa). Giữ tên do thư viện áp đặt (class Tailwind, gói npm, `README.md`…).

  | Loại | Kiểu |
  |---|---|
  | Component | `PascalCase` |
  | Hook | `useXxx` |
  | Hằng số | `UPPER_SNAKE` |
  | Biến môi trường FE | `VITE_UPPER_SNAKE` |

- **Comment tiếng Việt**, chỉ giải thích *vì sao* hoặc quy tắc nghiệp vụ. Không để code chết. Không bắt lỗi cho trường hợp không thể xảy ra.
- **Bất đồng bộ:** hàm dùng `async function`; method trong class dùng `async methodName(...) {}`. Không async arrow function, không gán function vào class field.

---

## 3. Lệnh

```bash
# frontend/
npm run dev | lint | build      # dev gọi API theo VITE_API_BASE_URL (.env.local) · lint 0 lỗi · build được
npm run build:pages             # bản demo GitHub Pages (dữ liệu minh họa)

# backend/
npm run dev | lint              # nodemon src/server.js · lint 0 lỗi
npm run test:contract           # test service với model giả, không cần DB
npm run test:ingestion          # test module kéo học bổng, không cần mạng / DB
npm run ingest:dry              # chạy thử kéo học bổng, không ghi DB
```

**Demo:** đẩy `frontend/dist/` (sau `build:pages`) lên nhánh `gh-pages` → https://hoanganh-toichoi.github.io/SchoolarsGo/

---

## 4. Backend

### 4.1 Kiến trúc ba lớp

```
routes/          URL + middleware: auth, requireRole, validate(schema)
  → controllers/ đọc req → gọi service → trả res. Không nghiệp vụ, không gọi DB
  → services/    nghiệp vụ (luật chuyển trạng thái đơn, mốc nhắc hạn…). Không gọi DB client trực tiếp
  → models/      chỉ truy vấn DB (Supabase client hoặc pg). Không nghiệp vụ
```

Vi phạm ranh giới → sửa trước khi merge (`chat.service` còn gọi thẳng Supabase: cần tách `chat.model`).

### 4.2 Cấu trúc thư mục

```
backend/src/
  server.js app.js     mở cổng + bật cron · middleware chung (helmet, cors, cookie, rate limit) + gắn routes
  routes/ controllers/ services/ models/   một file mỗi nhóm; routes/index.js tự nạp *.routes.js (saved.routes.js → /saved)
  middlewares/         auth (auth, optionalAuth), requireRole, validate, upload, rateLimiter
  jobs/                tự nạp hàm start*: nhắc hạn 7:00, kéo học bổng CN 2:00, tắt học bổng quá hạn 3:00
  ingestion/           module kéo học bổng, tự chứa (đọc index.js trước)
  configs/ validations/ utils/   CORS, DB, JWT, mail, Supabase · schema zod theo nghiệp vụ · hash, hàm thuần dùng chung
backend/scripts/migrations/  00N_tenMigration.sql, đánh số tăng dần, chạy lại không lỗi
backend/tests/       contracts/ (test service) · ingestion/ (test module kéo học bổng)
```

### 4.3 Class: một bản dùng chung

**Mỗi file class xuất sẵn một bản dùng chung, không container, không `this` cho phụ thuộc.**

- Cuối file model / service / controller chỉ có `export default new SavedService();`.
- **Cấm:** `const x = new X(); export default x;` · `export { Class }` · constructor nhận phụ thuộc.
- Nơi dùng `import savedService from '~/services/saved.service.js'` rồi gọi thẳng. Service gọi model đã import; model gọi `getSupabase()` trong từng hàm. Không tham chiếu lại bản dùng chung.
- Hàm phụ chỉ file đó dùng (dựng prompt, quy đổi, kiểm tra…) viết thành method private `#tên` trong chính class và gọi bằng `this.#tên()`; hàm dùng ≥ 2 file thì tách ra `utils/`. `this` chỉ cho trạng thái riêng (cache, parser) và hàm private.
- Bản dùng chung chạy lúc import nên `import 'dotenv/config'` là dòng đầu `app.js`, `server.js`.
- Không event bus: cần gì thì gọi thẳng trong service.

### 4.4 ESM + Express 5

- `"type": "module"`: `import` / `export` có đuôi `.js`, không `require`. Nhiều hàm xuất `export { a, b }`.
- **Import nội bộ dùng `~/` (= `backend/src/`), không `../`**; cùng thư mục thì `./`. `register.js` + `aliasLoader.js` dạy Node hiểu `~/`, nên mọi lệnh chạy `src/` phải có `--import ./register.js` (script `dev`, `start`, `test:*`, `ingest`, `railway.json` đã có); `jsconfig.json` chỉ cho VS Code.
- `__dirname` = `path.dirname(fileURLToPath(import.meta.url))`. Cần đặt biến môi trường trước khi nạp module → `await import()`.
- Express 5: `req.query` chỉ đọc (`validate` đã xử lý), `req.body` luôn là object.

### 4.5 Cách viết hàm

- **Mỗi dòng tối đa 3 thao tác, tốt nhất 1 đến 2.** Không lồng hàm hay phương thức. Chuỗi dài thì tách bằng biến trung gian có tên nói rõ ý nghĩa, rồi xử lý ở dòng kế.
- **Mỗi hàm một việc**, tên nói đúng việc (`detectKind`, `toGpa4`). Không viết hàm dài rồi chia đoạn bằng comment: tách thành hàm nhỏ. Hàm phụ là method private `#tên` trong class (xem 4.3); hàm dùng ≥ 2 file mới tách ra `utils/`.

```js
// Sai: 4 thao tác trên một dòng, khó đọc, khó gỡ lỗi
const draft = cvDraftSchema.parse(JSON.parse(raw.trim().replace(/```json|```/g, '')));

// Đúng: mỗi dòng một đến hai thao tác
const cleaned = raw.trim();
const parsed = JSON.parse(cleaned);
const draft = cvDraftSchema.parse(parsed);
```

### 4.6 Cấu hình và hằng số (không viết cứng)

| Loại giá trị | Đặt ở | Ví dụ |
|---|---|---|
| Số ma thuật (timeout, giới hạn kích thước / độ dài, ngưỡng), MIME, regex, danh sách giá trị hợp lệ, thông báo | `constants/<tínhNăng>.js` | `constants/cv.js` |
| Mã lỗi + thông báo | nhóm trong `constants/errors.js` | `new AppError(cv.SCANNED)` |
| Mọi thứ đọc từ biến môi trường (`process.env`), kể cả giá trị khác nhau theo môi trường (production / dev) | hàm trong `configs/<tênDịchVụ>.config.js` | `getGeminiModel()` |

- Service, middleware **không** đọc `process.env` trực tiếp.
- Không đặt cấu hình trong `utils/`, không tự gõ lại mã lỗi (vd. dùng `authorization.ACCESS_TOKEN_EXPIRED`).

### 4.7 Phân quyền và phiên đăng nhập

- **Đăng nhập:** `auth` (bắt buộc) hoặc `optionalAuth` → `req.user = { id, sid, role }`; token trong cookie httpOnly.
- **Admin:** `router.use(auth, requireRole('admin'))` đầu file route.
- **Dữ liệu của người dùng** (đơn, đã lưu, thông báo, tài liệu): model **luôn lọc theo `user_id`** (`findByIdAndUser(id, userId)`). Không thấy → **404** (không 403, để không lộ bản ghi tồn tại).
- Access token 15 phút; refresh token 7 ngày, lưu hash trong `user_sessions`. LocalStorage FE chỉ giữ `{ full_name, avatar_url }`; quyền admin luôn lấy từ `/auth/me`.

### 4.8 Lỗi

- **Controller không `try/catch/next`**, handler chỉ `(req, res)`: Express 5 tự chuyển lỗi `async` sang `errorHandle.controller`.
- **Service, model cũng không `try/catch` chỉ để đổi lỗi:** để lỗi rơi xuống `errorHandle.controller`. Muốn đổi lỗi thư viện (PDF hỏng, Gemini, JSON hỏng…) thành mã chuẩn thì thêm mã vào `constants/errors.js` + một mapper ở file đó. Chỉ `try/catch` khi thật sự có cách xử lý tiếp (thử lại, giá trị dự phòng).
- **Lỗi nghiệp vụ:** class `AppError` nằm cùng các định nghĩa lỗi trong `constants/errors.js` (không còn `utils/AppError.js`), nhập bằng `import { AppError } from '~/constants/errors.js'`. Chỉ có một cách ném:

  ```js
  throw new AppError(saved.ALREADY_SAVED);              // định nghĩa { statusCode, code, message } dựng sẵn
  throw new AppError(profile.gpaOutOfRange(maxGpa));    // thông báo có phần thay đổi thì định nghĩa là hàm
  ```

  **Không** tự gõ chữ / mã / status ở nơi ném lỗi, không còn `AppError.badRequest | notFound…`. Nhóm đặt theo tính năng (`application`, `saved`, `profile`, `cv`…). Danh sách giá trị hợp lệ dùng trong thông báo lấy từ `constants/<tínhNăng>.js`, không gõ lại.
- **`errorHandle.controller.js`** → `resolveError()` đổi mọi lỗi (zod, Postgres, JWT, multer, JSON hỏng, `AppError`, lỗi lạ) thành `{ statusCode, code, errorCode, message, details }`; lỗi lạ trả 500 chung chung. Kiểu lỗi mới = mã trong `constants/errors.js` + một mapper ở file này.

### 4.9 Response và kiểm tra đầu vào

- **Response** (`response.controller.js` gắn `res.success/created/error`, mount đầu `app.js`):
  - Thành công: `{ success, data, message, meta }`.
  - Lỗi: `{ success: false, message, code, error, errors? }`. `code` và `errors` FE đang đọc, **không đổi tên / bỏ**; `error` là mã UPPER_SNAKE_CASE.
  - Mọi response lỗi (kể cả 404, rate limit, upload) qua `res.error(…)`.
- **Đầu vào** kiểm tra bằng zod ở `validations/<nghiệpVụ>.validation.js`, gắn route qua `validate(schema, 'query' | 'body' | 'params')`. Sai → 400 `VALIDATION_ERROR` kèm `errors` từng trường.

### 4.10 Query

- Chọn cột cụ thể, không `SELECT *` / `select('*')`.
- Không N+1: JOIN / select lồng (`scholarships(id, title)`) hoặc `Promise.all`.
- Lọc theo cột mới → kiểm tra index, thiếu thì thêm trong migration.
- **Bảng mới:** `ENABLE ROW LEVEL SECURITY` và **không tạo policy**. App không dùng Supabase Auth (`auth.uid()` luôn NULL); backend dùng service role nên không bị chặn, còn khóa anon (công khai) không đọc ghi được gì. Test: `npm run test:integration` trên Supabase local.
- **Lọc không viết gọn được bằng SQL** (tính điểm, so khớp hồ sơ, xếp hạng):
  1. Model lấy nhẹ `id` + cột điều kiện.
  2. Service lọc / chấm điểm / sắp xếp, phân trang trên danh sách `id`.
  3. Model lấy bản ghi đầy đủ một lần theo `id` (`.in('id', ids)` / `WHERE id = ANY($1)`), service ghép đúng thứ tự.

  Điều kiện gọn (bằng, khoảng, `ILIKE`, `user_id`) thì để SQL lọc luôn.
- "Hôm nay", "còn N ngày" tính theo giờ `Asia/Ho_Chi_Minh`.

### 4.11 Test

- Mỗi hàm service mới có test: đúng, đầu vào sai, không tìm thấy.
- Giả lập model bằng `tests/contracts/helpers/mockService.js` (`mockService`, `mockSupabase`) **trước** khi `await import()` service; mỗi test gán `ref.current` = model giả, không gọi DB thật.
- `tests/setupEnv.js` đặt biến môi trường giả. Test lỗi / response: `tests/contracts/errorResponse.contract.test.js`.

---

## 5. Frontend

### 5.1 Cấu trúc

```
frontend/src/
  App.jsx, main.jsx    router (trang tải lười) · Provider Redux + React Query + Router
  pageLoaders.js       hàm tải từng trang + tải trước khi rảnh (thêm trang mới: thêm vào đây)
  pages/<trang>/       index.jsx (chỉ ghép component, không gọi API) + components/ hooks/ helpers/ constants/
  layouts/             userLayout, adminLayout: index.jsx để dùng, components/ là phần triển khai
  components/          ui/ (shadcn) · common/ · application/ · scholarship/ · scholarshipFilter/ · legacy/ (code mới không dùng)
  hooks/ services/     TanStack Query dùng chung · <nhóm>.service.js gọi API qua utils/apiClient
  store/slices/ utils/ Redux: auth, comparison, ui · cn, format, scholarship, application, security, palette, demo/
```

- Mỗi trang / component / layout là **một thư mục có `index.jsx`**.
- Import bằng `~/`, không `../`. Thứ tự: thư viện ngoài → `~/layouts`, `~/components` → `~/hooks` → `~/utils`, `~/store`, `~/services`.
- Component `export default function Ten()`; riêng `components/ui/` giữ named export kiểu shadcn.

### 5.2 Tổ chức file phụ của trang / layout (bắt buộc)

Không để `helper.js`, `constants.js`, `useXxx.js`, `navConfig.js` lẻ cạnh `index.jsx`:

```
pages/deadlines/
  index.jsx  components/
  hooks/       index.js + useDeadlineEvents.js        mỗi hook một file
  helpers/     index.js + buildDeadlineEvents.js …    mỗi hàm thuần một file, tên file = tên hàm
  constants/   index.js + toneDot.js, legend.js …     mỗi nhóm hằng số một file, tên nói nội dung
```

- Tên file nói đúng việc (`getMonthDays.js`, `validateGPA.js`), một file một việc. Chỉ tạo thư mục khi có thứ để bỏ vào.
- `index.js` chỉ re-export; nơi dùng import qua thư mục (`~/pages/deadlines/helpers`), không import sâu từng file. Trong thư mục dùng `./tenFile`. `helpers/` được import `constants/` cùng trang, ngược lại không.
- **Mặc định mọi thứ ở lại trang.** Chỉ khi **≥ 2 trang** (hoặc 1 trang + 1 component chung) dùng mới chuyển:

  | Loại | Chuyển tới |
  |---|---|
  | Hàm | `src/utils/<chủĐề>.js` |
  | Hằng số | `src/utils/constants.js` |
  | Hook | `src/hooks/` |

  Không chuyển trước "phòng khi cần"; hai hàm trùng tên khác hành vi (vd. `formatFileSize` của `applicationDetail` và `profile`) không phải dùng chung, không copy sang trang khác.
- Thêm trang mới dùng khung này ngay từ đầu, không tạo `helper.js` "tạm".

### 5.3 Cách viết component

Đầy đủ ở `frontendRules.md`; viết đúng từ đầu, không đợi review.

- **Component chỉ hiển thị.** Không ternary lồng, không dựng dữ liệu trong JSX: tính toán → hàm thuần ở `helpers/` (có test); gọi API / điều hướng / toast → hook ở `hooks/`. Không `try/catch` rỗng trong component, lỗi API xử lý ở `onSuccess` / `onError` của hook.
- **Một quy tắc = một nơi:** màu theo mức gấp `TONE_CLASS` (`utils/palette.js`), chữ hạn nộp `getDeadlineLabel` (`utils/scholarship.js`), đường dẫn `ROUTES` (`utils/routes.js`). Sắp chép logic hay bản đồ màu sang file thứ hai → dừng, gom lại.
- **Không giá trị cứng:** không `[Npx]`, không mã màu trong `className`; nhãn dùng ≥ 2 nơi, route, số ma thuật → `constants/`; cỡ mới thì thêm token `tailwind.config.js`. Không lề âm bù padding layout (dùng `PageBand`). "Hôm nay" tính một lần rồi truyền xuống.
- Sửa lỗi có thể lặp ở trang khác → ghi vào "Nhật ký quy tắc" trước khi báo xong.

### 5.4 Dữ liệu đặt ở đâu

| Dữ liệu | Đặt ở |
|---|---|
| Từ server | TanStack Query trong `hooks/` gọi `services/`, không gọi axios trong component |
| Toàn cục (giao diện, phiên đăng nhập) | Redux, đọc bằng selector `selectXxx`. **Không lưu token** |
| Từ khóa + bộ lọc | URL trang chủ qua `useScholarshipFilters()` |
| Cục bộ | `useState` |

### 5.5 Hiệu năng, bảo mật, truy cập

- **Chuyển trang không nháy:** `Suspense` quanh `<Outlet />` trong layout, router bật `v7_startTransition`. Tải quá 5 giây → `SlowLoading`. `Reveal` chỉ chạy khi có dữ liệu, tôn trọng `prefers-reduced-motion`.
- **XSS:** không `dangerouslySetInnerHTML` (bắt buộc thì qua `sanitizeHtml()`); URL từ dữ liệu qua `safeUrl()`; link tab mới có `rel="noopener noreferrer"`.
- **Accessibility:** thẻ thật (`<button>`, `<a href>`, `<label>`); nút chỉ có icon có `aria-label`; icon trang trí `aria-hidden`; hover và focus nhìn thấy được.

### 5.6 Thiết kế

**Chỉ 5 màu**, khai báo duy nhất trong `src/index.css`:

| Màu | Mã | Dùng cho |
|---|---|---|
| primary | `#4F46E5` | nút chính, liên kết, "Du học" |
| neutral | `#3F3F46` | chữ, viền, "Trong nước" |
| success | `#067647` | hạn > 30 ngày |
| warning | `#B54708` | hạn 11–30 ngày |
| danger | `#B42318` | hạn ≤ 10 ngày, lỗi, xóa |

- Component **không viết mã màu** (`#…`, `text-blue-500`): dùng token `brand-600`, `heading`, `fg`, `fg-muted`, `line`, `canvas`, `hover`, `urgent`/`soon`/`open`, `abroad`/`domestic`. Màu trong JS → `color()` ở `utils/palette.js`. Chưa làm chế độ tối.

**Bố cục và trang**

- **Bố cục:** header 64px (logo | tìm kiếm giữa | chuông + tài khoản), sidebar 256px `sticky`, lề nội dung `p-4 sm:p-6 lg:p-8`; dưới `lg` sidebar thành menu trượt (`Sheet`). **Thông báo** không có trang riêng: bấm chuông sổ danh sách (`notificationMenu`).
- **Tìm kiếm:** một thanh duy nhất trên header, kết quả ở trang chủ. Chi tiết học bổng `/scholarships/:slug` (tạo bằng `scholarshipPath()`).
- **Danh sách học bổng** dùng `ScholarshipGrid` + `ScholarshipCard`; danh sách đơn dạng dòng (học bổng | giấy tờ | trạng thái).
- **Trang chi tiết** gói trong 1280×800: đầu trang (tên, nhãn, hành động bên phải) + cột chính | cột phụ `sticky`.
- **Nút quay lại** luôn dùng `BackLink`, nhãn ghi tên trang sẽ về ("Đơn ứng tuyển"), không ghi "Quay lại".
- Mỗi vùng chỉ 1 nút chính (nền tím). Nhãn luôn mang nghĩa; hạn nộp dùng `getDeadlineInfo()` (ngưỡng 10 và 30 ngày).
- Lưới `auto-fill` + `minmax(min(Npx,100%),1fr)`; chữ không tràn (`min-w-0`, `truncate`). Lỗi lặp nhiều nơi → sửa ở component gốc.

**Kích thước và kiểu chữ**

| | Giá trị |
|---|---|
| Điều khiển / mục sidebar | 40px / 38px |
| Bo góc | thẻ 14px · ô con 10px · nút 8px |
| Khoảng cách | bội số 4 |
| Font | Be Vietnam Pro |
| Cỡ chữ | tiêu đề trang 24 · tiêu đề thẻ 17 · tiêu đề khối 15 · thân 13–14 · nhãn 11.5–12 |

- Icon Heroicons solid. Chuyển động 150–220ms. Không gradient, không emoji trang trí.
