# Kế hoạch: Access token 15 phút + Refresh token 7 ngày

> Giao cho: Codex · Nhánh: `feat/authRefreshToken` tách từ `dev` · Đọc `CLAUDE.md` trước khi làm.
> Phạm vi: chỉ phần đăng nhập/phiên. Không đổi giao diện trang đăng nhập.

## 1. Hiện trạng và vấn đề

| # | Hiện tại (file) | Vấn đề |
|---|---|---|
| 1 | Một JWT sống **7 ngày** trong cookie `token` (`token.service.js`, `auth.controller.js`) | Lộ token là kẻ gian dùng được 7 ngày, không thu hồi được |
| 2 | Đăng xuất chỉ xóa cookie (`logout`) | Token cũ vẫn hợp lệ tới hết 7 ngày |
| 3 | `POST /auth/refresh` đi qua middleware `auth` | Token hết hạn thì không refresh được; còn hạn thì refresh vô hạn |
| 4 | Đặt lại mật khẩu không thu hồi phiên (`resetPassword`) | Đổi mật khẩu vì bị lộ nhưng kẻ gian vẫn đăng nhập |
| 5 | `login` không kiểm tra `users.is_active` | Admin khóa tài khoản (`PATCH /admin/users/:id/status`) nhưng người đó vẫn đăng nhập được |
| 6 | Admin đổi role → JWT cũ vẫn mang role cũ 7 ngày | Gỡ quyền admin không có tác dụng ngay |
| 7 | JWT chứa `email` | Thông tin cá nhân nằm trong token, không cần |
| 8 | `jwt.verify` không chỉ định thuật toán, `JWT_SECRET` không kiểm tra độ dài | Nên khóa `HS256`, secret ≥ 32 byte |
| 9 | `middlewares/auth.js` tự trả `res.status(401).json` | Lệch quy ước `AppError` → `errorHandler`; FE không phân biệt "hết hạn" với "sai token" |
| 10 | FE `apiClient.js` gặp 401 là đá về `/login` | Khi access còn 15 phút, người dùng sẽ bị đá ra liên tục |
| 11 | Cookie `sameSite: 'lax'` cố định | Nếu FE và BE khác site khi deploy thật, cookie không được gửi |

## 2. Thiết kế đích

```
Đăng nhập ──► accessToken (JWT, 15 phút)   cookie httpOnly, path=/api
          └─► refreshToken (chuỗi ngẫu nhiên, 7 ngày) cookie httpOnly, path=/api/auth
              DB chỉ lưu sha256(refreshToken)

Gọi API ── 401 ACCESS_TOKEN_EXPIRED ──► FE gọi POST /auth/refresh (1 lần cho mọi request đang chờ)
                                          ├─ ok  → cấp cặp mới, token cũ bị thu hồi → FE gửi lại request
                                          └─ lỗi → FE đăng xuất, về /login
```

### Quy tắc
1. **Access token:** JWT HS256, payload chỉ `{ sub: userId, role }`, `expiresIn: '15m'`. Không lưu DB. Không thu hồi được → bù bằng thời gian ngắn.
2. **Refresh token:** `crypto.randomBytes(32).toString('base64url')`, **không phải JWT**. DB lưu `sha256`, không lưu bản gốc.
3. **Hạn 7 ngày tính từ lần refresh gần nhất** (trượt): người dùng mở app ít nhất 1 lần/7 ngày thì không phải đăng nhập lại. *(Điểm cần HA chốt — xem mục 7.)*
4. **Xoay vòng (rotation):** mỗi lần refresh → thu hồi token cũ, cấp token mới cùng `family_id`.
5. **Phát hiện dùng lại:** token **đã bị thu hồi** gửi lên lần nữa → coi là bị đánh cắp → thu hồi **cả family** (phiên đó trên mọi thiết bị đã copy) → 401 `REFRESH_TOKEN_REUSED`.
   - Ngoại lệ chống đua giữa 2 tab: token bị xoay **dưới 30 giây** trước → trả 401 `REFRESH_RACE`, **không** thu hồi family. FE gặp mã này thì gửi lại request gốc (cookie mới đã có do tab kia nhận).
6. **Thu hồi toàn bộ phiên của user khi:** đặt lại mật khẩu · admin khóa tài khoản · admin đổi role.
7. **Refresh kiểm tra user:** không tồn tại hoặc `is_active = false` → thu hồi + 401. Role đưa vào access token mới **đọc từ DB**, không chép từ token cũ.
8. **Đăng xuất:** thu hồi family của refresh token hiện tại + xóa 2 cookie. Không cần đăng nhập vẫn gọi được (access có thể đã hết hạn).
9. **Cookie:** `httpOnly`, `secure` khi production, `sameSite` đọc từ `COOKIE_SAME_SITE` (mặc định `lax`; FE/BE khác site thì `none` + bắt buộc `secure`).
10. **CSRF:** request ghi (POST/PUT/PATCH/DELETE) có header `Origin` không nằm trong danh sách CORS → 403. Chặn được trường hợp `sameSite=none`.
11. **Bearer header:** giữ đọc `Authorization: Bearer` cho Swagger/test, nhưng **chỉ cho access token**. Refresh chỉ đọc từ cookie.

### Bảng `refresh_tokens` (migration số tiếp theo còn trống, đặt tên `00N_refreshTokens.sql`)

```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   UUID NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user   ON refresh_tokens(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry ON refresh_tokens(expires_at);
```
Không lưu IP (dữ liệu cá nhân, chưa cần). Cập nhật `docs/database.md`.

### API

| Endpoint | Đầu vào | Thành công | Lỗi |
|---|---|---|---|
| `POST /auth/login` | body email, password | đặt 2 cookie, trả `{ user }` | 401 `INVALID_CREDENTIALS` · 403 `ACCOUNT_LOCKED` |
| `POST /auth/register` | như cũ | đặt 2 cookie | như cũ |
| `POST /auth/refresh` | cookie `refreshToken` (**bỏ** middleware `auth`) | đặt 2 cookie mới, trả `{ user }` | 401 `REFRESH_TOKEN_MISSING` / `_INVALID` / `_EXPIRED` / `_REUSED` / `REFRESH_RACE` |
| `POST /auth/logout` | cookie `refreshToken` (có thể không có) | xóa 2 cookie, luôn 200 | — |
| Mọi route có `auth` | cookie `accessToken` | — | 401 `ACCESS_TOKEN_MISSING` / `ACCESS_TOKEN_EXPIRED` / `ACCESS_TOKEN_INVALID` |

Mọi lỗi 401/403 trả qua `AppError` → `{ success: false, message, code }`. Cập nhật `docs/api.md`.

## 3. File cần sửa / tạo

**Backend**
| File | Việc |
|---|---|
| `scripts/migrations/00N_refreshTokens.sql` | **Mới** — bảng trên |
| `src/repositories/refreshToken.repository.js` | **Mới** — `create`, `findByHash`, `revoke(id)`, `revokeFamily(familyId)`, `revokeAllForUser(userId)`, `deleteExpired(before)`. Chọn cột cụ thể |
| `src/services/token.service.js` | `signAccess({ id, role })` 15m HS256 · `verifyAccess(token)` · `newRefreshToken()` → `{ raw, hash }` · `hash(raw)`. Kiểm tra `JWT_SECRET` ≥ 32 ký tự lúc khởi tạo |
| `src/services/session.service.js` | **Mới** — `start(user, userAgent)`, `rotate(raw, userAgent)`, `end(raw)`, `endAllForUser(userId)`. Toàn bộ quy tắc 3–7 nằm ở đây |
| `src/services/auth.service.js` | login/register gọi `session.start`; login chặn `is_active=false`; `resetPassword` gọi `endAllForUser`; xóa `refreshToken` cũ. Giữ ≤ 200 dòng |
| `src/services/admin.service.js` | đổi role / khóa user → `session.endAllForUser`. File đang vượt ngưỡng: **chỉ thêm 2 lời gọi**, không tách trong PR này |
| `src/controllers/auth.controller.js` | 2 cookie (`accessToken` path `/api`, `refreshToken` path `/api/auth`), `refresh`, `logout` mới; xóa cookie `token` cũ khi login/logout. ≤ 100 dòng |
| `src/middlewares/auth.js` | đọc `accessToken`, dùng `tokenService.verifyAccess`, ném `AppError` có mã; `req.user = { id: sub, role }` |
| `src/middlewares/checkOrigin.js` | **Mới** — quy tắc 10, gắn trong `app.js` sau `cors` |
| `src/middlewares/rateLimiter.js` | `refreshLimiter`: 30 lần / 15 phút / IP (production) |
| `src/routes/auth.routes.js` | `/refresh` bỏ `auth`, thêm `refreshLimiter` |
| `src/container.js` | thêm một khối `refreshTokenRepository → sessionService`, truyền vào `AuthService`, `AdminService` |
| `src/jobs/` (job 3:00 đêm đã có) | thêm `deleteExpired`: xóa token hết hạn hoặc bị thu hồi quá 7 ngày |
| `.env.example` | bỏ `JWT_EXPIRES_IN`; thêm `ACCESS_TOKEN_TTL=15m`, `REFRESH_TOKEN_DAYS=7`, `COOKIE_SAME_SITE=lax` |

**Frontend**
| File | Việc |
|---|---|
| `src/utils/apiClient.js` | Interceptor 401: mã `ACCESS_TOKEN_EXPIRED` → gọi `/auth/refresh` **một lần dùng chung** (biến `refreshPromise`), các request đang chờ đợi promise này rồi gửi lại **1 lần** (`config._retried`). `REFRESH_RACE` → gửi lại request gốc. Refresh thất bại / mã khác → `loggedOut()` + về `/login?redirect=<trang hiện tại>`. Không refresh cho chính request `/auth/*` |
| `src/services/auth.service.js` | thêm `refresh: () => api.post('/auth/refresh')` |
| Trang login | đọc `redirect` để quay lại trang cũ sau khi đăng nhập |

Không lưu token ở Redux/localStorage (giữ quy tắc hiện tại).

## 4. Thứ tự làm (mỗi bước 1 commit)

1. Migration + `refreshToken.repository.js` + `docs/database.md`
2. `token.service` + `session.service` + test hợp đồng (mục 5)
3. `auth.service`, `auth.controller`, `auth.routes`, `middlewares/auth.js`, `container.js`
4. `admin.service` thu hồi phiên · `checkOrigin` · `refreshLimiter` · job dọn token
5. FE `apiClient.js` + `redirect` sau đăng nhập
6. `docs/api.md`, `.env.example`, chạy checklist trong `CLAUDE.md`

## 5. Test bắt buộc — `tests/contracts/session.contract.test.js` và `auth.contract.test.js`

Repository giả (object cùng tên hàm), đồng hồ giả (`now`) để không phải chờ 15 phút. Thêm `test:contract` chạy được không cần DB.

| # | Tình huống | Kỳ vọng |
|---|---|---|
| T1 | Đăng nhập đúng | trả access (hết hạn sau đúng 900 s) + refresh; DB có 1 dòng, lưu **hash** khác chuỗi gốc |
| T2 | Đăng nhập tài khoản `is_active=false` | 403 `ACCOUNT_LOCKED`, không tạo dòng nào |
| T3 | Access sau 14:59 | hợp lệ · sau 15:01 → `ACCESS_TOKEN_EXPIRED` |
| T4 | Access ký bằng secret khác / `alg: none` | `ACCESS_TOKEN_INVALID` |
| T5 | Refresh hợp lệ | cặp mới; token cũ có `revoked_at`; token mới cùng `family_id`, hạn = now + 7 ngày |
| T6 | Refresh sau 7 ngày + 1 giây | `REFRESH_TOKEN_EXPIRED` |
| T7 | Dùng lại token cũ sau 31 giây | `REFRESH_TOKEN_REUSED`; **mọi** token cùng family bị thu hồi; token mới nhất cũng không dùng được |
| T8 | Dùng lại token cũ sau 10 giây | `REFRESH_RACE`; family **không** bị thu hồi |
| T9 | Refresh khi admin đã đổi role user→admin | access mới mang role `admin` |
| T10 | Refresh khi user bị khóa | 401, family bị thu hồi |
| T11 | Đăng xuất rồi refresh | `REFRESH_TOKEN_INVALID` (hoặc `_REUSED`) |
| T12 | Đặt lại mật khẩu | mọi refresh token của user bị thu hồi; phiên khác user không bị ảnh hưởng |
| T13 | Refresh chuỗi rác / thiếu cookie | `REFRESH_TOKEN_INVALID` / `REFRESH_TOKEN_MISSING` |
| T14 | `JWT_SECRET` < 32 ký tự | khởi tạo `TokenService` ném lỗi |

## 6. Kết quả đầu ra đo được (nghiệm thu)

| Tiêu chí | Cách đo | Đạt khi |
|---|---|---|
| Test | `npm run test:contract` | T1–T14 pass, test cũ vẫn pass |
| Chất lượng | `npm run lint` (BE + FE), `npm run build` (FE) | 0 lỗi |
| Thời hạn | giải mã cookie `accessToken` bằng jwt.io | `exp − iat = 900` |
| Cookie | DevTools → Application → Cookies | `accessToken` path `/api`, `refreshToken` path `/api/auth`, cả 2 HttpOnly; `refreshToken` Max-Age 604800 |
| DB không lộ token | `SELECT token_hash FROM refresh_tokens` | không dòng nào trùng giá trị cookie |
| Trải nghiệm | đặt tạm `ACCESS_TOKEN_TTL=30s`, dùng app 2 phút, mở 2 tab | **không** bị đá về `/login`; Network thấy `/auth/refresh` gọi **1 lần** mỗi đợt dù nhiều request cùng 401 |
| Đăng xuất thật | copy cookie `refreshToken` → đăng xuất → `curl` refresh bằng cookie cũ | 401 |
| Đánh cắp | dùng cookie refresh cũ (đã xoay > 30 s) | 401 `REFRESH_TOKEN_REUSED`, tab đang dùng bị đăng xuất ở lần refresh kế tiếp |
| Khóa tài khoản | admin khóa user đang đăng nhập | user bị đăng xuất trong **≤ 15 phút** |
| CSRF | `curl -X POST … -H "Origin: https://evil.example"` kèm cookie | 403 |
| Số dòng | `wc -l` file đã sửa | trong ngưỡng `CLAUDE.md` (trừ `admin.service` đã vượt từ trước) |

PR mô tả: bảng kết quả trên với ✅/❌ từng dòng + ảnh DevTools cookie.

## 7. Cần HA chốt trước khi giao

1. **Hạn 7 ngày trượt hay cố định?** Đề xuất: **trượt** (dùng app đều thì không phải đăng nhập lại). Cố định = 7 ngày sau đăng nhập luôn phải đăng nhập lại dù đang dùng.
2. **Deploy thật FE và BE có chung site không?** Khác site (vd FE `github.io`, BE `onrender.com`) → `COOKIE_SAME_SITE=none`.

## 8. Ngoài phạm vi

Danh sách thiết bị đăng nhập, "đăng xuất mọi thiết bị" trên giao diện, 2FA, đăng nhập Google, Redis. Bảng `refresh_tokens` đã đủ dữ liệu để làm sau.
