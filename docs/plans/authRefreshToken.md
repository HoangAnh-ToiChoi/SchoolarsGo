# Kế hoạch: Đăng nhập — access 15 phút, refresh 7 ngày, tối đa 3 thiết bị

> Giao cho: Codex · Nhánh `feat/authSession` tách từ `dev` · Đọc `CLAUDE.md` trước.
> **Được phép xóa code auth cũ và viết lại** (middleware, token service, controller, interceptor FE, lưu phiên FE). Không sửa giao diện trang đăng nhập/đăng ký.

## 0. Quy tắc viết code cho việc này

- **Tái sử dụng:** mỗi việc một hàm, dùng lại ở mọi nơi: `setAuthCookies` / `clearAuthCookies`, `toSessionUser`, `hashToken`, `isAllowedOrigin`. Không copy đoạn code giống nhau 2 lần.
- **Đơn giản, không lồng:** `return` sớm, tối đa 2 tầng `if`/vòng lặp, hàm ≤ 30 dòng. Thấy rối thì xóa viết lại.
- **Truy vấn:** code chỉ **dựng điều kiện**, việc **lọc / đếm / sắp xếp / giới hạn làm trong SQL** (`WHERE`, `COUNT`, `ORDER BY`, `LIMIT`). Không lấy cả danh sách về rồi `.filter()` bằng JS.
- Dùng thư viện `jsonwebtoken` (đã có) cho cả 2 token, không tự viết ký/giải mã.

## 1. Hiện trạng và vấn đề

| # | Hiện tại | Vấn đề |
|---|---|---|
| 1 | Một JWT sống 7 ngày trong cookie `token` | Lộ là bị dùng 7 ngày; đăng xuất chỉ xóa cookie, token vẫn sống |
| 2 | `POST /auth/refresh` đi qua middleware `auth` | Hết hạn thì không refresh được; còn hạn thì refresh vô hạn |
| 3 | Không giới hạn thiết bị, không có danh sách thiết bị | Không biết tài khoản đang đăng nhập ở đâu, không đá được máy lạ |
| 4 | Đặt lại mật khẩu, admin khóa tài khoản, admin đổi role không thu hồi phiên | Gỡ quyền / khóa không có tác dụng |
| 5 | `login` không kiểm tra `users.is_active` | Tài khoản bị khóa vẫn đăng nhập được |
| 6 | JWT chứa `email`; `/auth/me` trả email, SĐT, ngày sinh | Lộ thông tin cá nhân ra FE nhiều hơn cần |
| 7 | FE lưu **cả** `user` (có email, role) vào `localStorage` (`store/index.js`) | Sửa tay `role: 'admin'` trong localStorage là thấy menu admin |
| 8 | `middlewares/auth.js` tự `res.status(401).json` | Lệch quy ước `AppError`; FE không phân biệt "hết hạn" với "sai" |
| 9 | FE gặp 401 là về `/login` | Access 15 phút → bị đá ra liên tục |
| 10 | CORS: production chỉ `FRONTEND_URL`, dev regex localhost; không chặn request ghi từ nơi lạ | Không có danh sách rõ ràng; thêm GitHub Pages / Vercel phải sửa code |
| 11 | FE Vercel (`*.vercel.app`) gọi BE Railway (`*.railway.app`) = **khác site** | Cookie `SameSite=Lax` không được gửi → không đăng nhập được; Safari chặn cookie khác site kể cả `None` |
| 12 | `app.js` không `trust proxy` | Sau proxy Railway, rate limit đếm theo IP của proxy → mọi người chung 1 hạn mức |

## 2. Thiết kế

```
Đăng nhập ─► tạo 1 dòng user_sessions (1 dòng = 1 thiết bị)
             đang có 3 thiết bị → thu hồi thiết bị lâu không dùng nhất (như Zalo)
          ─► accessToken  JWT { sub, sid, role }  15 phút  cookie httpOnly path=/api
          ─► refreshToken JWT { sub, sid }        7 ngày   cookie httpOnly path=/api/auth
             DB lưu sha256(refreshToken), không lưu bản gốc

Gọi API ─ 401 ACCESS_TOKEN_EXPIRED ─► FE gọi /auth/refresh (1 lần dùng chung cho mọi request đang chờ)
                                        ok  → token mới, hạn 7 ngày tính lại từ bây giờ (trượt) → gửi lại request
                                        lỗi → xóa phiên FE → /login?redirect=<trang cũ>
```

### Quy tắc nghiệp vụ

1. **Access token:** ký bằng `JWT_ACCESS_SECRET`, `algorithm: 'HS256'`, `expiresIn: '15m'`. Không tra DB khi kiểm tra → thiết bị bị thu hồi vẫn dùng tiếp tối đa 15 phút (chấp nhận).
2. **Refresh token:** ký bằng `JWT_REFRESH_SECRET` (khác secret access), có `jti` ngẫu nhiên, `expiresIn: '7d'`. Hai secret ≥ 32 ký tự, thiếu thì server không khởi động.
3. **Trượt:** mỗi lần refresh cấp token mới hạn 7 ngày tính từ lúc đó, cập nhật `expires_at`, `last_used_at`. Không mở app 7 ngày → phải đăng nhập lại.
4. **Tối đa 3 thiết bị:** đăng nhập mới khi đã có 3 phiên còn hiệu lực → thu hồi phiên có `last_used_at` cũ nhất (`revoked_reason = 'device_limit'`). Thiết bị bị đá nhận `SESSION_REVOKED` ở lần refresh kế tiếp, FE báo "Tài khoản đã đăng nhập trên thiết bị khác".
5. **Xoay vòng + phát hiện đánh cắp:** refresh → giải mã lấy `sid` → tìm phiên theo `sid`, so hash:
   - trùng `refresh_token_hash` → hợp lệ, cấp token mới, hash cũ chuyển sang `previous_token_hash`.
   - trùng `previous_token_hash` và vừa xoay **< 30 giây** → `REFRESH_RACE` (2 tab refresh cùng lúc), không thu hồi.
   - còn lại → token cũ bị dùng lại → thu hồi phiên (`'reused'`) → `REFRESH_TOKEN_REUSED`.
6. **Refresh kiểm tra user:** không tồn tại hoặc `is_active = false` → thu hồi + 401. `role` trong access mới **đọc từ DB**.
7. **Thu hồi mọi phiên của user khi:** đặt lại mật khẩu (`'password_reset'`), admin khóa (`'locked'`), admin đổi role (`'role_changed'`).
8. **Đăng xuất:** thu hồi phiên hiện tại (`'logout'`) + xóa 2 cookie, luôn trả 200, không cần access còn hạn.
9. **Đăng nhập tài khoản bị khóa:** 403 `ACCOUNT_LOCKED`, không tạo phiên.

### Dữ liệu người dùng ở FE

| Nơi | Chứa | Không chứa |
|---|---|---|
| `GET /auth/me` → **Redux** (bộ nhớ) | `id, full_name, avatar_url, role` | email, SĐT, ngày sinh |
| **localStorage** `scholarsgo.session` | `full_name, avatar_url` (hiện tên/ảnh ngay khi tải lại trang) | email, mật khẩu, **role**, token |
| `GET /auth/account` → React Query, chỉ trang hồ sơ gọi | `email, phone, date_of_birth` | — |

- Login, register, refresh, `/me` trả **cùng một dạng** qua một hàm `toSessionUser(user)`.
- Mở app: có `scholarsgo.session` → gọi `/auth/me` → nạp Redux. Trong lúc chờ, route admin hiện skeleton, **không** quyết định quyền từ localStorage.
- Menu tài khoản (`userMenu`) bỏ dòng email; toast "Chào mừng" dùng `full_name`.
- Quyền thật luôn do BE quyết (`requireRole`); FE chỉ ẩn/hiện menu.

### CORS và chống bypass

- `CORS_ORIGINS` trong `.env`, **so khớp nguyên chuỗi**, ví dụ:
  `http://localhost:5173,http://localhost:4173,https://hoanganh-toichoi.github.io,https://<tên-app>.vercel.app`
  (Origin không có đường dẫn: GitHub Pages là `https://hoanganh-toichoi.github.io`, không kèm `/SchoolarsGo`.)
- Một hàm `isAllowedOrigin(origin)` dùng chung cho `cors()` và `checkOrigin`:
  - chỉ `ALLOWED.has(origin)`; **cấm** regex, `endsWith`, `includes`, `*`.
  - từ chối `Origin: null`.
- `checkOrigin`: request ghi (POST/PUT/PATCH/DELETE) có `Origin` không nằm trong danh sách → 403 `ORIGIN_NOT_ALLOWED`. Không có `Origin` (curl, server gọi server) → cho qua, vì không có cookie trình duyệt để lợi dụng.
- Phải chặn được: `https://hoanganh-toichoi.github.io.evil.com`, `https://evil-hoanganh-toichoi.github.io`, `http://localhost:5173.evil.com`, `https://evil.vercel.app`, `null`.

### Deploy (FE Vercel, BE Railway)

- **Bước 0:** kiểm tra BE còn sống: `curl https://<railway-app>/api/health`. Chết thì làm và nghiệm thu ở local trước, deploy tính sau.
- **Đề xuất: cho Vercel làm proxy** để FE và BE thành **cùng một site** → cookie `SameSite=Lax` chạy được trên mọi trình duyệt kể cả Safari, không cần `SameSite=None`. Thêm vào `frontend/vercel.json`, **đặt trước** dòng rewrite về `index.html`:
  `{ "source": "/api/(.*)", "destination": "https://<railway-app>/api/$1" }`, và đặt `VITE_API_BASE_URL=/api` trên Vercel.
- BE: `app.set('trust proxy', Number(process.env.TRUST_PROXY || 1))` để rate limit đếm theo IP thật. Kiểm tra `req.ip` trên log Railway là IP của mình, không phải IP proxy.
- `COOKIE_SAME_SITE` vẫn đọc từ `.env` (mặc định `lax`), chỉ đổi `none` nếu bỏ proxy.

## 3. Bảng `user_sessions` — migration `00N_userSessions.sql` (số tiếp theo còn trống)

```sql
CREATE TABLE IF NOT EXISTS user_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash  TEXT NOT NULL,
  previous_token_hash TEXT,
  rotated_at          TIMESTAMPTZ,
  device_name         TEXT,          -- "Chrome · Windows", suy từ User-Agent
  last_used_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ NOT NULL,
  revoked_at          TIMESTAMPTZ,
  revoked_reason      TEXT,          -- logout | device_limit | reused | password_reset | locked | role_changed
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
  ON user_sessions(user_id, last_used_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry ON user_sessions(expires_at);
```
Không lưu IP. Cập nhật `docs/database.md`.

**Giới hạn 3 thiết bị trong 1 transaction (pg)**, chống 2 lần đăng nhập cùng lúc thành 4 thiết bị:
```sql
BEGIN;
SELECT id FROM users WHERE id = $1 FOR UPDATE;              -- khóa theo user
UPDATE user_sessions SET revoked_at = now(), revoked_reason = 'device_limit'
 WHERE id IN (SELECT id FROM user_sessions
               WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
               ORDER BY last_used_at DESC OFFSET 2);         -- giữ 2 phiên mới nhất
INSERT INTO user_sessions (...) VALUES (...) RETURNING id;
COMMIT;
```

## 4. API

| Endpoint | Auth | Thành công | Lỗi |
|---|---|---|---|
| `POST /auth/register` | — | 2 cookie, `{ user }` | 409 `USER_EXISTS` |
| `POST /auth/login` | — | 2 cookie, `{ user }` | 401 `INVALID_CREDENTIALS` · 403 `ACCOUNT_LOCKED` |
| `POST /auth/refresh` | cookie refresh (**bỏ** middleware `auth`) | 2 cookie mới, `{ user }` | 401 `REFRESH_TOKEN_MISSING` / `_INVALID` / `_EXPIRED` / `_REUSED` · `REFRESH_RACE` · `SESSION_REVOKED` |
| `POST /auth/logout` | — | xóa cookie, 200 | — |
| `GET /auth/me` | `auth` | `{ id, full_name, avatar_url, role }` | 401 |
| `GET /auth/account` | `auth` | `{ email, phone, date_of_birth }` | 401 |
| `GET /auth/sessions` | `auth` | `[{ id, device_name, last_used_at, created_at, is_current }]` (≤ 3) | 401 |
| `DELETE /auth/sessions/:id` | `auth` | thu hồi thiết bị đó | 404 nếu không phải của mình |
| Mọi route có `auth` | cookie access | — | 401 `ACCESS_TOKEN_MISSING` / `_EXPIRED` / `_INVALID` |

Mọi lỗi qua `AppError` → `{ success: false, message, code }`. Cập nhật `docs/api.md`.

## 5. File cần làm

**Backend**
| File | Việc |
|---|---|
| `scripts/migrations/00N_userSessions.sql` | **Mới** — mục 3 |
| `src/repositories/session.repository.js` | **Mới** (pg) — `createWithLimit` (transaction mục 3), `findById`, `rotate`, `revoke(id, reason)`, `revokeAllForUser(userId, reason)`, `listActive(userId)`, `deleteOld()` |
| `src/services/token.service.js` | **Viết lại** — `signAccess`, `verifyAccess`, `signRefresh`, `verifyRefresh`, `hashToken`; kiểm tra 2 secret lúc khởi tạo |
| `src/services/session.service.js` | **Mới** — `start`, `refresh`, `end`, `endAllForUser`, `list`, `endOne`; quy tắc 3–6 nằm hết ở đây |
| `src/services/auth.service.js` | login/register gọi `session.start`; chặn `is_active=false`; `resetPassword` → `endAllForUser`; `getAccount`; xóa `refreshToken` cũ; `toSessionUser` |
| `src/services/admin.service.js` | khóa / đổi role → `session.endAllForUser`. File đang vượt ngưỡng: **chỉ thêm lời gọi**, không tách trong PR này |
| `src/controllers/auth.controller.js` | **Viết lại** gọn — `setAuthCookies`, `clearAuthCookies` (xóa cả cookie `token` cũ); ≤ 100 dòng |
| `src/middlewares/auth.js` | **Viết lại** — đọc cookie `accessToken` (hoặc `Bearer` cho Swagger), `verifyAccess`, ném `AppError`; `req.user = { id: sub, sid, role }` |
| `src/utils/origins.js` | **Mới** — `isAllowedOrigin` |
| `src/middlewares/checkOrigin.js` | **Mới** |
| `src/app.js` | `trust proxy`, `cors({ origin: (o, cb) => cb(null, !o \|\| isAllowedOrigin(o)), credentials: true })`, `checkOrigin` |
| `src/middlewares/rateLimiter.js` | `refreshLimiter` 30 lần / 15 phút / IP |
| `src/routes/auth.routes.js` | route mục 4 |
| `src/container.js` | thêm 1 khối `sessionRepository → sessionService`, truyền vào `AuthService`, `AdminService` |
| job 3:00 đêm đã có | gọi `deleteOld`: xóa phiên hết hạn hoặc thu hồi quá 7 ngày |
| `.env.example` | bỏ `JWT_SECRET`, `JWT_EXPIRES_IN`; thêm `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, `COOKIE_SAME_SITE=lax`, `TRUST_PROXY=1` |

**Frontend**
| File | Việc |
|---|---|
| `src/utils/apiClient.js` | **Viết lại** interceptor: `ACCESS_TOKEN_EXPIRED` → `refreshOnce()` (1 promise dùng chung) → gửi lại request **1 lần**; `REFRESH_RACE` → gửi lại request; lỗi khác → `sessionEnded()`. Không refresh cho request `/auth/*` |
| `src/store/index.js`, `store/slices/authSlice.js` | **Viết lại** phần lưu: localStorage chỉ `{ full_name, avatar_url }`; Redux giữ kết quả `/me`; thêm `isLoading` khi đang gọi `/me` |
| `src/hooks/useAuth.js` | `useSessionBootstrap()` gọi `/me` lúc mở app; login/register dùng `{ user }` mới |
| `src/components/common/ProtectedRoute.jsx` | chờ `/me` xong mới xét quyền admin |
| `userMenu` | bỏ email |
| trang hồ sơ | email/SĐT/ngày sinh lấy từ `GET /auth/account`; thêm khối **"Thiết bị đăng nhập"**: danh sách ≤ 3, nhãn "Thiết bị này", nút "Đăng xuất" từng thiết bị (component mới ≤ 200 dòng) |
| trang login | đọc `redirect`; hiện thông báo khi bị đá vì `SESSION_REVOKED` |
| `frontend/vercel.json` | rewrite `/api/*` (mục Deploy) |

## 6. Thứ tự làm (mỗi bước 1 commit)

1. Migration + `session.repository` + `docs/database.md`
2. `token.service` + `session.service` + test mục 7
3. `auth.service`, `auth.controller`, `auth.routes`, `middlewares/auth.js`, `container.js`
4. `admin.service`, `origins.js` + `checkOrigin` + CORS + `trust proxy`, `refreshLimiter`, job dọn
5. FE: `apiClient`, lưu phiên, `/me` lúc mở app, `ProtectedRoute`, `userMenu`
6. FE: thiết bị đăng nhập, `/auth/account`, `redirect` sau đăng nhập
7. `vercel.json`, `docs/api.md`, `.env.example`, checklist `CLAUDE.md`

## 7. Test bắt buộc (`tests/contracts/`, repository giả + đồng hồ giả, không cần DB)

| # | Tình huống | Kỳ vọng |
|---|---|---|
| T1 | Đăng nhập đúng | access `exp − iat = 900`; refresh 7 ngày; DB lưu **hash**, khác chuỗi gốc |
| T2 | Tài khoản bị khóa đăng nhập | 403 `ACCOUNT_LOCKED`, không tạo phiên |
| T3 | Access sau 14:59 / 15:01 | hợp lệ / `ACCESS_TOKEN_EXPIRED` |
| T4 | Access ký secret khác, `alg: none`, ký bằng refresh secret | `ACCESS_TOKEN_INVALID` |
| T5 | Refresh hợp lệ | token mới; `expires_at` = now + 7 ngày (trượt); hash cũ thành `previous_token_hash` |
| T6 | Refresh sau 7 ngày + 1 giây không dùng | `REFRESH_TOKEN_EXPIRED` |
| T7 | Dùng lại token cũ sau 31 giây | `REFRESH_TOKEN_REUSED`, phiên bị thu hồi, token mới nhất cũng chết |
| T8 | Dùng lại token cũ sau 10 giây | `REFRESH_RACE`, phiên không bị thu hồi |
| T9 | Đăng nhập thiết bị thứ 4 | phiên `last_used_at` cũ nhất bị thu hồi `device_limit`; còn đúng 3 phiên; thiết bị bị đá refresh → `SESSION_REVOKED` |
| T10 | Admin đổi role / khóa user | mọi phiên bị thu hồi; refresh → 401 |
| T11 | Đặt lại mật khẩu | mọi phiên của user đó bị thu hồi, user khác không ảnh hưởng |
| T12 | Đăng xuất rồi refresh | 401 |
| T13 | `DELETE /auth/sessions/:id` của người khác | 404 |
| T14 | `/auth/me` | đúng 4 trường `id, full_name, avatar_url, role`, không có email |
| T15 | `isAllowedOrigin` | 5 origin trong danh sách → true; 5 origin giả ở mục CORS → false |
| T16 | Thiếu secret / secret < 32 ký tự | khởi tạo `TokenService` ném lỗi |

## 8. Nghiệm thu đo được

| Tiêu chí | Cách đo | Đạt khi |
|---|---|---|
| Test | `npm run test:contract` | T1–T16 pass, test cũ vẫn pass |
| Chất lượng | `npm run lint` (BE, FE) · `npm run build` (FE) | 0 lỗi |
| Cookie | DevTools → Application → Cookies | `accessToken` path `/api`, `refreshToken` path `/api/auth`, cả 2 HttpOnly, refresh Max-Age 604800 |
| Không token trong DB | `SELECT refresh_token_hash FROM user_sessions` | không dòng nào trùng giá trị cookie |
| Không lộ thông tin | DevTools → Local Storage | chỉ `full_name`, `avatar_url`; sửa tay thêm `role: admin` → **không** thấy menu admin |
| Không bị đá ra | `ACCESS_TOKEN_TTL=30s`, dùng app 2 phút trên 2 tab | không về `/login`; mỗi đợt chỉ 1 request `/auth/refresh` |
| 3 thiết bị | đăng nhập 4 trình duyệt (Chrome, Edge, Firefox, ẩn danh) | trình duyệt dùng lâu nhất bị đá trong ≤ 15 phút, có thông báo; `/auth/sessions` trả 3 dòng |
| Đăng xuất thật | copy cookie refresh → đăng xuất → `curl` refresh bằng cookie cũ | 401 |
| CORS | `curl -X POST /api/auth/logout -H "Origin: https://hoanganh-toichoi.github.io.evil.com"` | 403 |
| Deploy (nếu Railway còn sống) | đăng nhập trên Safari/iPhone qua domain Vercel | đăng nhập được, F5 vẫn giữ phiên |
| Số dòng | `wc -l` file đã sửa | trong ngưỡng `CLAUDE.md` (trừ `admin.service` đã vượt từ trước) |

PR mô tả: bảng trên với ✅/❌ từng dòng + ảnh DevTools cookie và localStorage.

## 9. Ngoài phạm vi

2FA, đăng nhập Google, Redis, thu hồi access tức thì (cần tra DB mỗi request), lưu IP / vị trí thiết bị.
