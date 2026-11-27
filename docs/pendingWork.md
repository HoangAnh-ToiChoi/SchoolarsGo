# Việc còn tồn đọng

Cập nhật 27/11/2026. Danh sách việc **đã xác định nhưng chưa làm**, gom từ đợt review toàn repo (24/11/2026), các PR #48–#59, đợt rà bảo mật 25/11/2026 và đợt kiểm lại trên `dev` ngày 27/11/2026. Xong việc nào thì xóa dòng đó (ghi số PR vào commit). Việc mới phát sinh thì thêm vào đúng nhóm.

Mã `R##` là mã phát hiện trong báo cáo review (`docs/review/01-phat-hien.md`, hiện ở nhánh `review/fullAudit`, chưa vào `dev`). `M#` là mục MUST trong bản giao việc review ban đầu.

**Ký hiệu:** ❌ chưa làm · 🟡 làm một phần · ⏳ chờ người có quyền (Supabase / Railway / Vercel / GitHub)

**Nguyên tắc:** chưa refactor hay thêm feature (gateway AI/RAG, thông báo thông minh, trang duyệt staging) khi chưa xong các mục **MUST**. Mỗi đợt kết thúc bằng test + review.

## Thứ tự

| Đợt | Nội dung | Ai |
|---|---|---|
| 0 | MUST 1–3: rotate khóa, migration production, env production | Người giữ Supabase / Railway / Vercel |
| 1 | MUST 4–5: lưới test trên CI + DB dựng lại được từ repo | Dev |
| 2 | MUST 6 + SHOULD nhóm Backend/Auth: upload, kéo học bổng, phụ thuộc, lỗi model, giới hạn đầu vào | Dev |
| 3+ | SHOULD còn lại, refactor file vượt ngưỡng, rồi mới nâng cấp | Dev |

## 1. MUST — chặn refactor và nâng cấp

| # | Việc | Trạng thái | Cần làm / cách kiểm xong |
|---|---|---|---|
| 1 | **Thu hồi khóa** (R01, M3): mật khẩu DB, khóa Supabase anon + service role từng bị commit vào lịch sử git | ❌ hoãn theo quyết định 25/11 | Chi tiết ở mục 1b. Khóa service role bỏ qua mọi RLS |
| 2 | **Migration production 009 → 010 → 011** | ⏳ | Lệnh ở mục 2. Kiểm: `select count(*) from pg_policies where schemaname = 'public'` = 0. Trong repo RLS đã khóa (R04, M1), production chưa |
| 3 | **Env production**: Railway `NODE_ENV=production`, `JWT_*_SECRET` không phải chuỗi mẫu → merge #57; Vercel `BACKEND_URL` | ⏳ | Thiếu `NODE_ENV` thì guard JWT không bật, cookie mất `secure`, rate limit chạy mức dev. Kiểm `https://<domain-vercel>/api/health` |
| 4 | **Lưới test trước refactor** (R11, M8) | 🟡 | #59: CI chạy cho `dev`/`main`, chạy test thật, kiểm quy ước trên PR (chờ merge). Còn: chủ repo bật branch protection `dev`/`main` bắt buộc 3 check Backend / Frontend / Harness; đưa test đặc tả `tests/review/` (nhánh `review/fullAudit`) thành `tests/integration/` và chạy trên CI bằng Supabase local |
| 5 | **DB dựng lại được từ repo** (R03, M5) | ❌ | Không file SQL nào tạo `users.role / is_active / last_login_at`; `001_add_indexes.sql` tạo index trên bảng `saved` (không tồn tại, đúng là `saved_scholarships`); số 007 để trống; `chat_messages` nằm ngoài migration; chưa có bảng `schema_migrations` |
| 6a | **Upload** (R07, M7) | ❌ | `middlewares/upload.js` chỉ kiểm đuôi file, lưu MIME do client gửi; bucket `documents` public (`getPublicUrl`). Cần kiểm byte đầu bằng `file-type` (đã có trong dependencies, đang dùng cho CV), bucket private + signed URL |
| 6b | **Kéo học bổng ghi đè admin** (R08) | ❌ | `ingestion/save.js` cập nhật `is_active`, `summary` theo link bài → bật lại học bổng admin đã tắt, xóa chỗ admin đã sửa |
| 6c | **Khóa chống trùng** (R09) | ❌ | `ingestion/toRow.js` tạo `dedup_key` chỉ từ tiêu đề: gộp nhầm, chặn kỳ năm sau |
| 6d | **Phụ thuộc** (R30) | ❌ | `npm audit --omit=dev` 27/11: BE 5 high + 14 moderate, FE 5 high + 5 moderate. SDK `@google/generative-ai` đã hết hỗ trợ (chuyển `@google/genai`) |

## 1b. Bảo mật: thu hồi khóa — để kiểm lại sau (rà 25/11/2026)

Chưa làm theo quyết định ngày 25/11/2026 ("về vấn đề thu hồi khoá sẽ fix sau"). Chi tiết commit chứa khóa có trong báo cáo nội bộ, **không ghi ở đây** vì repo public.

| Việc | Ai | Cách kiểm xong |
|---|---|---|
| Rotate mật khẩu DB (R01) và xem log truy cập từ 15/05 | Người giữ Supabase + Railway | Mật khẩu cũ không còn đăng nhập được |
| **Thu hồi khóa Supabase anon + service role** từng bị commit vào lịch sử git (hạn tới 2032). Khóa service role đọc, ghi, xóa được mọi bảng, kể cả `users.password_hash` | Người giữ dự án Supabase | Dashboard → Project Settings → API: đổi JWT secret hoặc chuyển sang API key mới rồi tắt khóa cũ. Cập nhật `SUPABASE_SERVICE_ROLE_KEY` trên Railway, `VITE_SUPABASE_ANON_KEY` ở nơi build FE. Gọi PostgREST bằng khóa cũ phải bị từ chối |
| Xem log truy cập DB / API của Supabase từ 28/03/2026 | Người giữ dự án Supabase | Không có truy cập ngoài backend và nhóm |
| Kiểm `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` trên Railway là chuỗi ngẫu nhiên | Người giữ Railway | #57 chặn production khởi động với chuỗi mẫu. Không chắc thì đổi (mọi người bị đăng xuất một lần) |
| Lịch sử git vẫn chứa khóa và mật khẩu cũ. `git filter-repo` **không** thu hồi được khóa, chỉ làm sau khi đã đổi hết | Nhóm | Tùy chọn |
| gitleaks mặc định không bắt khóa Supabase dạng JWT và mật khẩu trong `.md`: thêm luật riêng hoặc bật GitHub secret scanning | Nhóm | Quét lại lịch sử có báo các khóa đã biết |

## 2. Sau khi merge các PR

Trạng thái 27/11/2026: **#48–#53, #55, #56 đã merge vào `dev`**; #54 (file này), #57, #59 còn mở. `main` chưa nhận các PR này (sau `dev` 46 commit).

**Chạy migration trên production theo thứ tự 009 → 010 → 011, trước khi đưa `dev` sang `main`.** 011 chạy được ngay và nên chạy ngay vì khóa anon đã lộ. Trong `backend/`, trên `dev` mới nhất, `.env.cloud` trỏ tới DB production:

```bash
node scripts/applyMigration.js --file=009_searchIndexes.sql --env=.env.cloud --allow-remote
node scripts/applyMigration.js --file=010_realtimeSignals.sql --env=.env.cloud --allow-remote
node scripts/applyMigration.js --file=011_rlsLockdown.sql --env=.env.cloud --allow-remote
```

| PR | Việc phải làm sau merge |
|---|---|
| #48 chat / gợi ý không LLM | `npm install` trong `backend/`. Railway: xóa `GROQ_API_KEY`, `OPENAI_API_KEY`, `ZHIPU_API_KEY` nếu có |
| #50 xóa cache khi đổi người dùng | **Thử bằng trình duyệt:** đăng nhập A → `/applications` → đăng xuất → đăng nhập B → không thấy đơn của A. Hết phiên trên bản GitHub Pages phải về `/SchoolarsGo/login` |
| #51 truy vấn backend | Migration 009 |
| #52 bundle FE | `npm run build:pages && npx vite preview --mode pages`: menu tài khoản demo hiện ngay, không bị chuyển sang `/login` |
| #55 realtime | Migration 010; đặt `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ở nơi build FE |
| #56 khóa RLS | Migration 011 |
| #57 JWT secret (chưa merge) | Kiểm `JWT_*_SECRET` và **`NODE_ENV=production`** trên Railway trước khi merge |
| #53 kéo tăng dần | Đưa `dev` → `main` (GitHub chỉ chạy lịch trên nhánh mặc định). Actions secrets `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`, `GEMINI_API_KEY` (tùy chọn); variables `PG_SSL`, `GEMINI_MODEL` |
| #59 CI | Chủ repo bật branch protection `dev`/`main` bắt buộc 3 check. Tên check đổi từ "Lint Backend"/"Build Frontend" thành "Backend (lint + test)"/"Frontend (lint + test + build)"/"Harness (hook test + quy ước)" |

## 3. SHOULD — làm trong các đợt refactor

| Nhóm | Việc | Trạng thái | Bằng chứng / ghi chú | Đợt |
|---|---|---|---|---|
| Auth | Access token còn dùng được 15 phút sau đăng xuất, khóa tài khoản, hạ quyền (R14) | ❌ | `middlewares/auth.js` chỉ verify JWT. Nhóm đã chấp nhận độ trễ 15 phút (`docs/plans/authRefreshToken.md`): **cần chốt** giữ hay kiểm phiên trong DB | 2 |
| Auth | Rate limit trong RAM, 4 route auth dùng chung bộ đếm theo IP (R15) | ❌ | `rateLimiter.js` không có `store`; khóa theo IP + email | 2 |
| Auth | Email khác chữ hoa thành 2 tài khoản; link reset ghi ra log khi thiếu SMTP (R16) | ❌ | `configs/nodemailer.js` in link reset | 2 |
| Backend | Model bỏ qua `error` của supabase-js: lỗi DB hiện thành 401/404 (R27) | ❌ | 14 chỗ `const { data } = await …` không kiểm `error` (auth.model 5, saved 3, application 2, scholarship 2, document 1, profile 1) | 2 |
| Backend | Admin: bộ lọc `?status` vô hiệu, thống kê theo trạng thái cũ, tạo học bổng thiếu trường trả 500 (R26) | ❌ | `admin.validation.js` không có `status` | 2 |
| Backend | Giới hạn đầu vào (R28) | 🟡 | `notes` max 5000 đã có. Còn: `checklist` không giới hạn số mục/độ dài, `documents_used` không kiểm thuộc người dùng, ứng tuyển học bổng đã tắt | 2 |
| Backend | Health check không kiểm DB; tắt server chưa trọn (R34) | ❌ | `app.js` luôn trả ok | 2 |
| Backend | `process.env` đọc ngoài `configs/` (trái CLAUDE.md 4.6) | ❌ | `errorHandle.controller.js`, `server.js`, `rateLimiter.js`, `authCookie.controller.js`, `app.js` | 3 |
| Backend | File vượt ngưỡng dòng | ❌ | `recommend.service.js` 311, `errorHandle.controller.js` 112, `admin.controller`, `admin.service`. Tách khi sửa tới | 3 |
| Dữ liệu | Cột thời gian không múi giờ; hạn ISO `Z` lúc 0h VN lệch một ngày (R25, M6) | ❌ | `database.sql` không có cột `TIMESTAMPTZ` nào. Dữ liệu hạn 2099 cũ: kiểm `count(*) where deadline >= '2090-01-01'` | 1–2 |
| Dữ liệu | `country` là chuỗi tự do (R22) | ❌ | ISO mới dùng cho `nationality`, `eligible_nationalities` | 3 |
| Dữ liệu | Mất transaction khi dùng supabase-js; index thừa/thiếu (R35) | ❌ | | 3 |
| Nghiệp vụ | Gợi ý thiếu điều kiện cứng: bậc học, quốc tịch, tuổi (R20, M9) | ❌ | `recommend.service.js` chỉ chặn theo GPA/IELTS | 3 |
| Nghiệp vụ | GPA thang 10 (R33) | 🟡 | CV đã quy về thang 4; form hồ sơ vẫn từ chối 8.5 / `gpa_scale` 10 | 2 |
| AI | Không timeout khi gọi Gemini (R19); lọc PII của CV còn hở (R17); prompt injection từ dữ liệu cào (R18) | ❌ | Chỉ còn CV và kéo học bổng gọi AI (#48) | 3 |
| Pipeline | Không có bước duyệt (staging); học bổng không hạn nộp hiện mãi (R29) | ❌ | **Cần chốt** cột `status` hay bảng staging | 4 |
| FE | ErrorBoundary không gửi Sentry; trang thiếu trạng thái lỗi có nút thử lại (R32) | ❌ | `ErrorBoundary.jsx` chỉ `console.error` | 3 |
| FE | a11y label của `Input` (R31) | 🟡 | `legacy/Input.jsx` đã gắn `htmlFor` theo `id \|\| name`; chưa kiểm bằng axe; modal admin tự viết | 3 |
| FE | 18 hàm trong `helpers/` chưa có test (R9 frontendRules); `helpers/` import `../../../utils` vì `node --test` không hiểu `~/` | ❌ | `node .claude/hooks/ciConventions.mjs <remote>/main` liệt kê đủ | 1 |
| FE | `frontend/vite.config.js` có 3 lỗi `no-undef` nhưng `npm run lint` chỉ quét `src/` | ❌ | | 3 |
| Harness | LAB dựng lại được (`supabase/config.toml`, seed dữ liệu giả, `docs/lab.md`); quy trình release `dev → main` (checklist, tag, smoke test); migration có bảng theo dõi | ❌ | | 1–2 |

**Đã xong sau đợt review 24/11** (không cần làm lại): R02 chat/gợi ý không còn gọi model đã tắt (#48) · R04 trong repo (#56) · R05 (#50) · R06 xóa tài liệu xóa luôn file · R10 tìm kiếm có dấu phẩy · R12 chat giới hạn tin nhắn · R13 Sentry không gửi cookie (#49) · R21 lọc GPA/IELTS giữ học bổng không yêu cầu · R23 danh sách quốc gia · R24 không nhắc hạn học bổng đã tắt · M2 một hệ auth · M4 cookie · sentinel 2099 trong code · regex ẩn email trong CV chạy O(n²) (#59).

## 4. Quyết định nhóm cần chốt trước đợt 1

1. **Nguồn sự thật của schema:** dump production làm baseline `000` (cần quyền DB production) hay sửa `database.sql` + migration cho dựng được từ trống rồi đối chiếu production sau.
2. **R14:** giữ độ trễ 15 phút hay kiểm phiên trong DB mỗi request.
3. **Duyệt dữ liệu cào:** cột `status` trên `scholarships` hay bảng staging riêng (quyết định cách sửa R08/R09).
4. **RAG/embedding:** dịch vụ `/rank` riêng (ADR 0003) hay pgvector; `docs/roadmap.md` và ADR đang ghi ngược nhau.
5. **Thời điểm rotate khóa** (MUST 1).

## 5. Dịch vụ RAG (Colab / Kaggle)

- Chỗ nối đã có (`docs/rankContract.md`): `ChatService.#answer()` và `return top` trong `RecommendService.recommend()`.
- Chưa có: client gọi dịch vụ RAG, xuất dữ liệu học bổng để tạo embedding, xác thực giữa backend và dịch vụ.

## 6. Việc nhỏ ghi lại để khỏi quên

- Proxy `/api` của Vercel dựa vào biến `BACKEND_URL`. Thiếu ở môi trường nào (Production / Preview) thì Vercel giữ nguyên chuỗi `${BACKEND_URL}` và mọi lời gọi API hỏng. Cookie `SameSite=lax` chạy được nhờ proxy này (cùng origin).
- Sau #56: bảng hoặc function do `supabase_admin` tạo vẫn theo default privileges của Supabase. **Bảng mới phải tự `ENABLE ROW LEVEL SECURITY`**; `npm run test:integration` trên Supabase local bắt bảng thiếu RLS (đưa vào CI ở đợt 1).
- Gợi ý đọc toàn bộ học bổng còn mở mỗi lần gọi (~0.4s với 4500 dòng). Lưu lượng tăng thì cache danh sách ứng viên vài phút.
- Báo cáo review: thêm mục đối chiếu các PR của upstream; đổi nhãn R14 thành "đánh đổi đã chấp nhận" nếu nhóm giữ.
