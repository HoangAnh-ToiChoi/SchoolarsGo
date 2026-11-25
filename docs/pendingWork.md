# Việc còn tồn đọng

Cập nhật 25/11/2026. Danh sách việc **đã xác định nhưng chưa làm**, gom từ đợt review toàn repo (24/11/2026), các PR #48–#56 và đợt rà bảo mật 25/11/2026. Xong việc nào thì xóa dòng đó (ghi số PR vào commit). Việc mới phát sinh thì thêm vào đúng nhóm.

Mã `R##` là mã phát hiện trong báo cáo review (`docs/review/01-phat-hien.md`, hiện ở nhánh `review/fullAudit`, chưa vào `dev`).

## 1. Khẩn: cần người có quyền làm ngay

| Việc | Ai | Ghi chú |
|---|---|---|
| Rotate mật khẩu DB (R01) và xem log truy cập từ 15/05 | Người giữ Supabase + Railway | Mật khẩu cũ đã lộ trong lịch sử git (chi tiết trong báo cáo review, không ghi ở đây). Xóa khỏi lịch sử cũng không thu hồi được, phải đổi mật khẩu |
| Chạy 2 script kiểm production (chỉ đọc) | Người giữ `.env` production | Kiểm chính sách RLS của `scholarships` (`pg_policy`), cột `users`, bucket `documents`; model AI còn sống không. Kết quả dùng để chốt R02, R03, R04, R06, R23 |

## 1b. Bảo mật: thu hồi khóa — để kiểm lại sau (rà 25/11/2026)

Chưa làm theo quyết định ngày 25/11/2026 ("về vấn đề thu hồi khoá sẽ fix sau"). Chi tiết commit chứa khóa có trong báo cáo nội bộ, **không ghi ở đây** vì repo public.

| Việc | Ai | Cách kiểm xong |
|---|---|---|
| **Thu hồi khóa Supabase anon + service role** từng bị commit vào lịch sử git (hạn tới 2032). Khóa service role bỏ qua mọi RLS: đọc, ghi, xóa được mọi bảng, kể cả `users.password_hash` | Người giữ dự án Supabase | Supabase Dashboard → Project Settings → API: đổi JWT secret hoặc chuyển sang API key mới rồi tắt khóa cũ. Cập nhật `SUPABASE_SERVICE_ROLE_KEY` trên Railway, `VITE_SUPABASE_ANON_KEY` ở nơi build FE. Gọi thử PostgREST bằng khóa cũ phải bị từ chối |
| Xem log truy cập DB / API của Supabase từ 28/03/2026 tìm truy cập lạ | Người giữ dự án Supabase | Không có truy cập ngoài backend và nhóm |
| Kiểm `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` trên Railway là chuỗi ngẫu nhiên, không phải chuỗi mẫu (`…-at-least-32-characters-long`) từng có trong repo | Người giữ Railway | Nhánh `fix/jwtSecretGuard` chặn production khởi động với chuỗi mẫu. Nếu không chắc thì đổi (mọi người bị đăng xuất một lần) |
| Lịch sử git vẫn chứa khóa và mật khẩu cũ. Xóa lịch sử (`git filter-repo`) **không** thu hồi được khóa, chỉ làm sau khi đã đổi hết | Nhóm | Tùy chọn, sau các bước trên |
| gitleaks mặc định **không** bắt được khóa Supabase dạng JWT và mật khẩu trong file `.md`. Thêm luật riêng hoặc bật GitHub secret scanning | Nhóm | Quét lại lịch sử có báo các khóa đã biết |



| PR | Việc phải làm sau merge |
|---|---|
| #48 chat / gợi ý không LLM | Chạy `npm install` trong `backend/` (gỡ `groq-sdk`, `openai`). Trên Railway, xóa biến `GROQ_API_KEY`, `OPENAI_API_KEY`, `ZHIPU_API_KEY` nếu có |
| #49 Sentry | Không có |
| #50 xóa cache khi đổi người dùng | **Thử bằng trình duyệt:** đăng nhập A → mở `/applications` → đăng xuất → đăng nhập B → không thấy đơn của A. Thử hết phiên trên bản GitHub Pages: phải về `/SchoolarsGo/login` |
| #51 truy vấn backend | **Chạy migration trên production:** `cd backend && node scripts/applyMigration.js --file=009_searchIndexes.sql` |
| #52 bundle FE | **Thử bản demo:** `npm run build:pages && npx vite preview --mode pages`. Menu tài khoản demo phải hiện ngay, không bị chuyển sang `/login` |
| #56 khóa RLS | **Merge và chạy migration trước khi merge #55** (#55 đưa khóa anon vào bundle FE): `node scripts/applyMigration.js --file=011_rlsLockdown.sql`. Kiểm: `select count(*) from pg_policies where schemaname='public'` = 0 |
| `fix/jwtSecretGuard` (chưa mở PR) | Trước khi deploy, kiểm `JWT_*_SECRET` trên Railway không phải chuỗi mẫu, nếu không production sẽ không khởi động. **Railway phải đặt `NODE_ENV=production`** (repo không tự đặt): thiếu biến này thì guard không bật, cookie mất cờ `secure`, rate limit chạy mức dev |
| #55 realtime | Chạy migration 010, đặt `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ở nơi build FE, kiểm Realtime còn cho kênh public |
| #53 kéo tăng dần | Merge tiếp `dev` → `main` (GitHub chỉ chạy lịch trên nhánh mặc định). Khai báo ở Settings → Secrets and variables → Actions: secrets `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`, `GEMINI_API_KEY` (tùy chọn); variables `PG_SSL`, `GEMINI_MODEL` |
| #49, #50, #52 | Merge lần lượt sẽ xung đột ở `docs/frontendRules/frontendRules.md`: mỗi PR thêm một dòng lên đầu Nhật ký quy tắc. Giữ cả các dòng |

## 3. Lỗi còn mở từ review (đã có test đặc tả đang fail)

Test ở `backend/tests/review/` trên nhánh `review/fullAudit`, chạy trên Supabase local theo `README.md` trong thư mục đó.

| Lỗi | Test đang fail | Đợt |
|---|---|---|
| `auth` không kiểm phiên còn hiệu lực, `is_active`, `role` từ DB (R14). Nhóm đã chấp nhận độ trễ 15 phút (`docs/plans/authRefreshToken.md`); cần quyết định có giữ không | `authz › admin bị hạ quyền…`, `authz › tài khoản bị khóa…`, `auth › sau đăng xuất…` | 2 |
| Rate limit dùng chung bộ đếm, không khóa theo IP + email (R15) | `rateLimit › bộ đếm dùng chung…` | 2 |
| Email không chuẩn hóa chữ hoa/thường; link reset ghi ra log (R16) | `auth › email khác chữ hoa…` | 2 |
| Upload: không kiểm byte đầu file, bucket public, xóa tài liệu không xóa file trên Storage (R06, R07) | `upload › HTML đổi đuôi…`, `upload › mime_type…`, `upload › xóa tài liệu…` | 2 |
| Đầu vào thiếu giới hạn: ghi chú 1MB ở đã lưu, checklist 5000 mục, ứng tuyển học bổng đã tắt (R28) | `input › note 1MB…`, `input › checklist 5000 mục…`, `input › không tạo được đơn cho học bổng đã tắt` | 2 |
| GPA thang 10 (8.5, `gpa_scale` 10) bị từ chối thay vì quy đổi | `input › GPA thang 10…` | 2 |
| Hạn nộp admin nhập dạng ISO `Z` lúc 0h VN bị đếm lệch một ngày | `logic › hạn admin nhập dạng ISO Z…`, `input › Hạn nộp theo Asia/Ho_Chi_Minh` | 2 |
| Gợi ý không xét bậc học bắt buộc và quốc tịch được nhận (hồ sơ Bachelor + VN vẫn được gợi ý học bổng chỉ cho PhD / người Nhật) | `logic › hồ sơ Bachelor + VN không được gợi ý…` | 2 |
| Admin: thống kê, bộ lọc `?status`, tạo học bổng thiếu trường trả 500 (R26); model bỏ qua `error` (R27) | `authz › bộ lọc ?status…`, `authz › admin tạo học bổng thiếu…` | 2 |

## 4. Nợ kỹ thuật theo đợt (chưa bắt đầu)

- **Đợt 1: DB dựng lại được + CI** (R03, R04, R11)
  - `000_baseline.sql` dump từ production; `007_userColumns.sql` (số 007 đang để trống cho việc này); sửa `001` (bảng `saved` → `saved_scholarships`); đưa `chat_messages` vào migration.
  - Bỏ RLS ghi công khai, bật RLS cho `ingestion_runs`.
  - `scripts/migrate.js` + bảng `schema_migrations`.
  - CI chạy cho `dev` (hiện chỉ PR vào `main`), chạy `test:contract`, `test:ingestion`, test FE, và job tích hợp trên Supabase local. Đổi `tests/review/` thành `tests/integration/`.
- **Đợt 3: LLM gateway**, điều kiện để nối dịch vụ RAG: `services/llm.service.js` một cổng cho mọi lần gọi AI (timeout, đổi nhà cung cấp, đếm lượt).
- **Đợt 4: pipeline kéo học bổng + staging**: trang duyệt học bổng trước khi hiện.

## 5. Dịch vụ RAG (Colab / Kaggle)

- Chỗ nối đã có (ghi trong `docs/rankContract.md`): `ChatService.#answer()` và `return top` trong `RecommendService.recommend()`.
- Chưa có: client gọi dịch vụ RAG, xuất dữ liệu học bổng cho việc tạo embedding, cách xác thực giữa backend và dịch vụ.

## 6. Việc nhỏ ghi lại để khỏi quên

- **Proxy `/api` của Vercel** (`frontend/vercel.json`) dựa vào biến `BACKEND_URL` trong project Vercel. Thiếu biến ở môi trường nào (Production / Preview) thì Vercel giữ nguyên chuỗi `${BACKEND_URL}` và mọi lời gọi API hỏng. Kiểm: mở `https://<domain-vercel>/api/health` và đăng nhập trên domain Vercel, `/api/auth/me` trả 200. Cookie `SameSite=lax` chạy được nhờ proxy này (cùng origin).
- Bucket `documents` còn public (R06, R07), không thuộc phạm vi #56.
- Sau #56: bảng hoặc function do `supabase_admin` tạo (extension, tính năng dashboard) vẫn theo default privileges của Supabase, role `postgres` không đổi được. **Bảng mới phải tự `ENABLE ROW LEVEL SECURITY`**. Chạy `npm run test:integration` trên Supabase local sẽ bắt bảng thiếu RLS hoặc có quyền cho anon. Nên đưa test này vào CI ở đợt 1.

- `frontend/vite.config.js` báo 3 lỗi `no-undef` (`process`, `__dirname`) khi chạy eslint, nhưng `npm run lint` chỉ quét `src/` nên chưa ai thấy.
- `errorHandle.controller.js`, `server.js`, `rateLimiter.js`, `authCookie.controller.js`, `app.js` còn đọc `process.env` trực tiếp (trái CLAUDE.md 4.6).
- Gợi ý (sau #51) đọc toàn bộ học bổng còn mở mỗi lần gọi (~0.4s với 4500 dòng). Lưu lượng tăng thì cache danh sách ứng viên vài phút.
- `recommend.service.js` (301 dòng) và `admin.*` vượt ngưỡng số dòng, tách khi sửa tới.
- Báo cáo review: thêm mục đối chiếu các PR của upstream; đổi nhãn R14 thành "đánh đổi đã chấp nhận".
