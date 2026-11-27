# Việc còn tồn đọng

Cập nhật 27/11/2026 (cuối Đợt 3, chờ merge). Danh sách việc **đã xác định nhưng chưa làm**, gom từ đợt review toàn repo (24/11/2026), các PR #48–#59, đợt rà bảo mật 25/11/2026 và đợt kiểm lại trên `dev` ngày 27/11/2026. Xong việc nào thì xóa dòng đó (ghi số PR vào commit). Việc mới phát sinh thì thêm vào đúng nhóm.

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
| 4 | **Lưới test trước refactor** (R11, M8) | 🟡 chờ merge | #59: CI chạy cho `dev`/`main`, chạy test thật, kiểm quy ước trên PR. Nhánh `fix/schemaBaseline`: 48 test đặc tả vào `tests/integration/` (17 lỗi đã biết gắn `todo` R##) + job CI Integration trên Supabase local. Nhánh `fix/feHelperTests`: 16 helper FE có test. Còn: chủ repo bật branch protection `dev`/`main` bắt buộc các check |
| 5 | **DB dựng lại được từ repo** (R03, M5) | 🟡 chờ merge | Nhánh `fix/schemaBaseline`: `000_baseline.sql` (từ `database.sql`), `007_userColumns.sql`, sửa `001`, `012_chatMessages.sql`, `npm run migrate` + bảng `schema_migrations`, LAB `docs/lab.md`. Còn: đối chiếu schema production bằng script chỉ đọc khi có quyền; production chạy `npm run migrate -- --env=.env.cloud --allow-remote` sau 009–011 |
| 6a | **Upload** (R06, R07, M7) | 🟡 chờ merge `fix/uploadSafety` | `middlewares/upload.js` chỉ kiểm đuôi file, lưu MIME do client gửi; bucket `documents` public (`getPublicUrl`). Nhánh: kiểm byte đầu bằng `file-type`, lưu MIME theo nội dung; migration 013 (cột `storage_path`, bucket private); API trả link ký 1 giờ; xóa tài liệu xóa đúng file (R06). Production: chạy 013 **trước** khi deploy backend |
| 6b | **Kéo học bổng ghi đè admin** (R08) | 🟡 chờ merge `fix/ingestionGuard` | Migration 014 `admin_locked_at` (admin sửa / ẩn thì khóa, dòng đang ẩn mà chưa quá hạn được khóa luôn); `save.js` không đụng dòng đã khóa. Dòng admin sửa nội dung trước 014 không nhận ra được |
| 6c | **Khóa chống trùng** (R09) | 🟡 chờ merge `fix/ingestionGuard` | `dedupKey` bỏ dấu, giữ đuôi phân biệt sau " - ", tiêu đề chung chung → NULL; kỳ năm sau làm mới dòng cũ đã quá hạn. Còn: cột `title UNIQUE` |
| 6d | **Phụ thuộc** (R30) | 🟡 chờ merge `fix/dependencies` | `npm audit --omit=dev` còn 0 / 0 (zod 4, nodemailer 10, react-router 7; vá open redirect `?redirect=/\evil.com`). SDK `@google/genai` 2.x: chờ merge `fix/aiSafety` (3.x cần Node ≥ 22) |

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

**Đợt 3** (sau Đợt 2): BE xếp chồng `fix/recommendRules` → `refactor/backendConventions` → `fix/aiSafety` (trên `fix/backendHardening`); FE `fix/frontendResilience` (trên `fix/dependencies`). Không có migration. `fix/aiSafety`: `npm ci` trong `backend/` (đổi SDK sang `@google/genai`).

**Sau khi merge các nhánh Đợt 2** (thứ tự merge: #59 → `fix/schemaBaseline` → `fix/feHelperTests` → `fix/dependencies` → `fix/uploadSafety` / `fix/ingestionGuard` / `fix/backendHardening`), trên production, trong `backend/`:

1. Kiểm dữ liệu trước (chỉ đọc): `SELECT gpa_scale, count(*) FROM profiles GROUP BY 1` (giá trị khác 4 / 5 / 10 thì PUT /profile có gửi `gpa_scale` sẽ bị 400); `SELECT lower(email), count(*) FROM users GROUP BY 1 HAVING count(*) > 1` (cặp trùng phải gộp tay).
2. `npm run migrate -- --env=.env.cloud --allow-remote --dry-run` rồi bỏ `--dry-run`: 013 (bucket `documents` private; báo thiếu quyền `storage.buckets` thì tắt Public trong Dashboard), 014 (khóa học bổng admin đã ẩn), 015 (email chữ thường). **Deploy backend ngay sau đó**: code mới đọc `storage_path`, code cũ mất link tải khi bucket đã private.
3. `node --import ./register.js scripts/recomputeDedupKeys.js --env=.env.cloud --allow-remote` (xem) → thêm `--apply`, trước lượt kéo học bổng kế tiếp.
4. Kiểm: `SELECT count(*) FROM documents WHERE storage_path IS NULL` (khác 0 là URL cũ không nhận ra, tài liệu đó không có link tải); `curl https://<backend>/api/health` → `data.db = "ok"`.
5. **Tài khoản `admin@scholarsgo.com`** (mật khẩu cũ gõ cứng trong `seedAdmin.js`, còn trong lịch sử git): có trên DB thật thì đổi mật khẩu hoặc khóa.

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
| Auth | Access token còn dùng được 15 phút sau đăng xuất, khóa tài khoản, hạ quyền (R14) | ✅ đánh đổi đã chấp nhận (28/11/2026) | Giữ độ trễ 15 phút: access token không kiểm DB; refresh kiểm phiên + `is_active` + đọc lại `role`. 3 test tích hợp ghi đúng hành vi này (`fix/aiSafety`). Muốn chặn tức thì thì phải kiểm phiên trong DB mỗi request | — |
| Auth | Rate limit trong RAM, 4 route auth dùng chung bộ đếm theo IP (R15) | 🟡 chờ merge `fix/backendHardening` | Đã tách bộ đếm từng route, đăng nhập khóa theo IP + email. Còn: store dùng chung khi chạy nhiều instance | 2 |
| Auth | Email khác chữ hoa thành 2 tài khoản; link reset ghi ra log khi thiếu SMTP (R16) | 🟡 chờ merge `fix/backendHardening` | Email chuẩn hóa ở đầu vào + migration 015; production không log link | 2 |
| Auth | `scripts/seedAdmin.js` gõ cứng email/mật khẩu admin (repo public), tự nạp `backend/.env`, không chặn host ngoài localhost: chạy nhầm lên production là tạo/nâng quyền admin với mật khẩu ai cũng biết | 🟡 chờ merge `fix/backendHardening` | Đã đọc từ env + rào `--allow-remote`. **Còn: kiểm production không có tài khoản dùng mật khẩu mặc định cũ** (người giữ Supabase) | 2 |
| Dữ liệu | Ràng buộc `role IN ('user','admin')` cho `users` | ❌ | Bỏ khỏi 007 vì `NOT VALID` vẫn kiểm mọi UPDATE. Chạy `SELECT DISTINCT role FROM users` trên production trước, rồi thêm ở migration mới | 2 |
| Backend | Model bỏ qua `error` của supabase-js: lỗi DB hiện thành 401/404 (R27) | 🟡 chờ merge `fix/backendHardening` (+ document.model ở `fix/uploadSafety`) | 14 chỗ `const { data } = await …` không kiểm `error` (auth.model 5, saved 3, application 2, scholarship 2, document 1, profile 1) | 2 |
| Backend | Admin: bộ lọc `?status` vô hiệu, thống kê theo trạng thái cũ, tạo học bổng thiếu trường trả 500 (R26) | 🟡 chờ merge `fix/backendHardening` | `admin.validation.js` không có `status` | 2 |
| Backend | Giới hạn đầu vào (R28) | 🟡 chờ merge `fix/backendHardening` | `notes` max 5000 đã có. Còn: `checklist` không giới hạn số mục/độ dài, `documents_used` không kiểm thuộc người dùng, ứng tuyển học bổng đã tắt | 2 |
| Backend | Health check không kiểm DB; tắt server chưa trọn (R34) | 🟡 chờ merge `fix/backendHardening` | `app.js` luôn trả ok | 2 |
| Backend | `process.env` đọc ngoài `configs/` (trái CLAUDE.md 4.6) | 🟡 chờ merge `refactor/backendConventions` | `configs/app.config.js`. Còn: `services/storage.service.js` (đã bỏ ở `fix/uploadSafety`, kiểm lại sau khi gộp) | 3 |
| Backend / FE | File vượt ngưỡng dòng | 🟡 chờ merge `fix/recommendRules`, `refactor/backendConventions`, `refactor/backendModules`, `refactor/frontendPages` | BE: tách `recommend.service`, `errorHandle.controller`, `swagger.js` 878 dòng → `src/docs/swagger/`, `ingestion/wordpress.js` + `save.js`. FE: `chat` 496→44, `dashboard` 357→33, `admin/scholarships` 304→66, `admin/users` 257→56; khung dùng chung `components/admin/` | 3 |
| Dữ liệu | Cột thời gian không múi giờ; hạn ISO `Z` lúc 0h VN lệch một ngày (R25, M6) | 🟡 chờ merge `fix/recommendRules` | Admin ghi hạn đổi về ngày VN (`toVnDate`), đếm ngày theo VN. Còn: cột vẫn không `TIMESTAMPTZ`; dữ liệu hạn 2099 cũ: kiểm `count(*) where deadline >= '2090-01-01'` | 1–2 |
| Dữ liệu | `country` là chuỗi tự do (R22) | ❌ | ISO mới dùng cho `nationality`, `eligible_nationalities` | 3 |
| Dữ liệu | Mất transaction khi dùng supabase-js; index thừa/thiếu (R35) | ❌ | | 3 |
| Nghiệp vụ | Gợi ý thiếu điều kiện cứng: bậc học, quốc tịch, tuổi (R20, M9) | 🟡 chờ merge `fix/recommendRules` | Chặn bậc học / quốc tịch / tuổi (chỉ khi chắc chắn quá tuổi vì hồ sơ chỉ có năm sinh). **Cần chốt:** cột `degree` của học bổng kéo về do regex đoán, sai thì chặn nhầm (vd. bài Master có nhắc PhD ở cuối); giữ chặn cứng hay chỉ trừ điểm với dữ liệu chưa được admin xác nhận | 3 |
| Nghiệp vụ | GPA thang 10 (R33) | 🟡 chờ merge `fix/backendHardening` | CV đã quy về thang 4; form hồ sơ vẫn từ chối 8.5 / `gpa_scale` 10 | 2 |
| AI | Không timeout khi gọi Gemini (R19); lọc PII của CV còn hở (R17); prompt injection từ dữ liệu cào (R18) | 🟡 chờ merge `fix/aiSafety` | R19 đã có `withTimeout` + nay hủy hẳn request (`abortSignal`). R17: thêm hộ chiếu / CCCD có nhãn, SĐT quốc tế, email viết tránh, NFKC, dòng địa chỉ. R18: thẻ `bai_viet`, provider theo danh sách ký tự. Còn: họ tên, trường, nơi làm việc vẫn gửi Gemini (không lọc được bằng regex: nên ghi rõ cho người dùng); số CCCD không nhãn | 3 |
| Pipeline | Không có bước duyệt (staging); học bổng không hạn nộp hiện mãi (R29) | ❌ | **Cần chốt** cột `status` hay bảng staging | 4 |
| FE | ErrorBoundary không gửi Sentry; trang thiếu trạng thái lỗi có nút thử lại (R32) | 🟡 chờ merge `fix/frontendResilience` | Boundary gửi Sentry (che email / SĐT trong message), tự reset khi đổi trang, lỗi tải chunk thì tải lại trang. Còn: trạng thái lỗi + nút thử lại cho trang legacy (recommend, compare, news, dashboard, chat, admin/*); boundary gốc quanh `<Routes>` (lỗi ở header / sidebar hiện trang trắng) | 4 |
| FE | a11y label của `Input` (R31) | 🟡 | `legacy/Input.jsx` đã gắn `htmlFor` theo `id \|\| name`; chưa kiểm bằng axe; modal admin tự viết | 3 |
| FE | 16 hàm trong `helpers/` chưa có test (R9 frontendRules); `helpers/` import `../../../utils` vì `node --test` không hiểu `~/` | 🟡 chờ merge | Nhánh `fix/feHelperTests` (loader `testRegister.js`, 50 test mới) | 1 |
| FE | `frontend/vite.config.js` có 3 lỗi `no-undef` nhưng `npm run lint` chỉ quét `src/` | 🟡 chờ merge `fix/frontendResilience` | Lint quét cả file cấu hình | 3 |
| Harness | LAB dựng lại được (`supabase/config.toml`, seed dữ liệu giả, `docs/lab.md`); quy trình release `dev → main` (checklist, tag, smoke test); migration có bảng theo dõi | ❌ | | 1–2 |

**Đã xong sau đợt review 24/11** (không cần làm lại): R02 chat/gợi ý không còn gọi model đã tắt (#48) · R04 trong repo (#56) · R05 (#50) · R10 tìm kiếm có dấu phẩy · R12 chat giới hạn tin nhắn · R13 Sentry không gửi cookie (#49) · R21 lọc GPA/IELTS giữ học bổng không yêu cầu · R23 danh sách quốc gia · R24 không nhắc hạn học bổng đã tắt · M2 một hệ auth · M4 cookie · sentinel 2099 trong code · regex ẩn email trong CV chạy O(n²) (#59).

## 4. Quyết định nhóm cần chốt trước đợt 1

1. **Nguồn sự thật của schema:** dump production làm baseline `000` (cần quyền DB production) hay sửa `database.sql` + migration cho dựng được từ trống rồi đối chiếu production sau.
2. ~~**R14**~~: đã chốt 28/11/2026 giữ độ trễ 15 phút.
3. **Duyệt dữ liệu cào:** cột `status` trên `scholarships` hay bảng staging riêng (quyết định cách sửa R08/R09).
4. **RAG/embedding:** dịch vụ `/rank` riêng (ADR 0003) hay pgvector; `docs/roadmap.md` và ADR đang ghi ngược nhau.
5. **Thời điểm rotate khóa** (MUST 1).

## 5. Dịch vụ RAG (Colab / Kaggle)

- Chỗ nối đã có (`docs/rankContract.md`): `ChatService.#answer()` và `return top` trong `RecommendService.recommend()`.
- Chưa có: client gọi dịch vụ RAG, xuất dữ liệu học bổng để tạo embedding, xác thực giữa backend và dịch vụ.

## 6. Việc nhỏ ghi lại để khỏi quên

- Proxy `/api` của Vercel dựa vào biến `BACKEND_URL`. Thiếu ở môi trường nào (Production / Preview) thì Vercel giữ nguyên chuỗi `${BACKEND_URL}` và mọi lời gọi API hỏng. Cookie `SameSite=lax` chạy được nhờ proxy này (cùng origin).
- Sau #56: bảng hoặc function do `supabase_admin` tạo vẫn theo default privileges của Supabase. **Bảng mới phải tự `ENABLE ROW LEVEL SECURITY`**; `npm run test:integration` trên Supabase local bắt bảng thiếu RLS (đưa vào CI ở đợt 1).
- CI: action ghim theo tag (`actions/checkout@v4`, `supabase/setup-cli@v1`), chưa ghim SHA; nên ghim SHA cho action bên thứ ba.
- `003_ingestion.sql` tạo `ingestion_runs` không bật RLS; `011` bật lại trong cùng lượt `npm run migrate`, chỉ hở nếu dừng giữa 003 và 011 trên DB trống.
- Gợi ý đọc toàn bộ học bổng còn mở mỗi lần gọi (~0.4s với 4500 dòng). Lưu lượng tăng thì cache danh sách ứng viên vài phút.
- Báo cáo review: thêm mục đối chiếu các PR của upstream; đổi nhãn R14 thành "đánh đổi đã chấp nhận" (đã chốt 28/11/2026).
- Từ Đợt 2 (models ném lỗi supabase-js): id sai dạng UUID ở đường dẫn (`/applications/abc`) trả 400 `INVALID_DATA_FORMAT` thay vì 404. Muốn 404 thì thêm `validate(idSchema, 'params')` cho các route còn thiếu (applications, documents, admin, auth/sessions).
- Rate limit tính theo `req.ip` với `TRUST_PROXY=1` (đúng khi chỉ có Railway đứng trước). Thêm Cloudflare / CDN thì phải tăng `TRUST_PROXY`, nếu không mọi người dùng chung một bộ đếm.
- Học bổng lừa đảo đăng lại với link mới và tiêu đề khác vẫn vào được (khóa admin chỉ chặn đúng dòng đã ẩn): cần blocklist nguồn / tiêu đề nếu gặp nhiều.
- Bản ghi tài liệu cũ có `file_url` không khớp dạng URL công khai: xóa bản ghi nhưng file còn trên Storage.
- Ingestion `classifyError` khớp `401|403|404` trên toàn bộ message lỗi Gemini: message có số này ở chỗ khác sẽ tắt AI cả lượt. Nên đọc `status` của `ApiError`.
- `utils/deadline.js toVnDate` nhận `Date` thì coi là đã đúng mốc VN: nếu sau này truyền Date do pg parse từ cột `timestamp` (giờ server UTC) sẽ lệch ngày.
- Swagger (`docs/swagger/index.js`): schema dữ liệu nằm ở `schemas` gốc thay vì `components.schemas` nên mọi `$ref` tới chúng bị hỏng trên `/api-docs` (có từ trước khi tách, giữ nguyên để refactor không đổi JSON).
- Lặp còn lại ở BE: hạn refresh token 7 ngày viết 3 nơi (`authCookie.controller`, `session.service` ×2; phải khớp nhau); `TIMEZONE` khai báo 3 nơi; tính phân trang ở 4 service/model.
- FE `dashboard`: nhãn trạng thái khác `STATUS_META` ("Được chấp nhận" / "Bị từ chối" thay vì "Được nhận" / "Từ chối"); badge truyền màu `amber`, `rose` mà `legacy/Badge` không có nên hiện không màu.
- FE `admin/users`: nếu bản ghi thiếu `is_active` thì nút ghi "Khóa" nhưng gửi `isActive: true` (backend hiện luôn trả cột này nên chưa xảy ra).
- `npm run lint` của BE còn 42 cảnh báo (`no-console`, `no-param-reassign` ở `scholarship.model`), 0 lỗi.
