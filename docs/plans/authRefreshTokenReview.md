# Kiểm tra nhánh `feat/authSession` — lần 1

> Kế hoạch gốc: [authRefreshToken.md](./authRefreshToken.md) · Commit được kiểm tra: `7b217c0`
> **Kết luận: chưa merge vào `dev`.** Sửa mục 2 (bắt buộc) rồi push lên **chính nhánh này**. Không merge, không force push.

## 1. Đã đạt

| Hạng mục | Kết quả |
|---|---|
| Test có sẵn | BE `test:contract` 30/30 · `test:ingestion` 57/57 · FE lint 0 lỗi · FE build qua · BE lint 0 lỗi (59 cảnh báo, `dev` là 56) |
| API thật (Postgres local, cùng bảng với DB thật) | 107/109 ca qua |
| Trình duyệt (Playwright) | 16/19 ca qua |
| Không token gọi 33 API cần đăng nhập | 32 trả 401, `POST /documents/upload` trả 400 (lỗi L2) |
| User thường gọi 10 API admin | 10/10 trả 403 |
| Token giả: rác, `alg: none`, sai secret, ký bằng refresh secret, sửa `role` trong payload, hết hạn | đều 401 |
| FE: chưa đăng nhập vào `/admin` | về `/login?redirect=%2Fadmin` |
| FE: user gõ `/admin`, `/admin/users`, `/admin/scholarships` | về trang chủ |
| FE: sửa localStorage thành `role: admin` | vẫn không vào được `/admin` |
| Cookie | `accessToken` Max-Age 900, Path `/api` · `refreshToken` Max-Age 604800, Path `/api/auth` · cả 2 HttpOnly, `document.cookie` rỗng |
| JWT / `/me` / localStorage | không có email; `/me` đúng 4 trường; localStorage chỉ `full_name`, `avatar_url` |
| DB | chỉ lưu hash 64 ký tự; migration 006 chạy 2 lần không lỗi |
| Refresh | hạn trượt 168 giờ · token cũ sau 31 giây → `REFRESH_TOKEN_REUSED` và cả phiên bị thu hồi · 2 tab dưới 30 giây không bị thu hồi |
| 3 thiết bị | máy thứ 4 đăng nhập → máy dùng lâu nhất bị đá (`device_limit`), trang đăng nhập hiện "đã đăng nhập trên thiết bị khác" · 6 lần đăng nhập đồng thời vẫn chỉ 3 phiên · xóa phiên người khác → 404 |
| Thu hồi | đổi role, khóa tài khoản, đặt lại mật khẩu đều thu hồi phiên · tài khoản bị khóa đăng nhập → 403 `ACCOUNT_LOCKED` |
| CORS | chặn `https://hoanganh-toichoi.github.io.evil.com`, `https://evil-hoanganh-toichoi.github.io`, `http://localhost:5173.evil.com`, `https://evil.vercel.app`, `null`; cho phép đúng danh sách |
| URL API | tự dò route theo tên file nhưng mọi URL giữ nguyên như `dev` |

## 2. Lỗi bắt buộc sửa

### L1 — Nặng: dùng app quá 15 phút là trang treo
- **File:** `frontend/src/utils/apiClient.js`, hàm `canRefresh`.
- **Hiện tại:** chỉ refresh khi URL là `/auth/me`, `/auth/account`, `/auth/sessions`.
- **Kế hoạch (mục 5):** refresh cho **mọi** request, **trừ** request `/auth/*` dùng để đăng nhập.
- **Tái hiện:** đăng nhập admin → ở `/admin` → để access hết hạn → bấm "Người dùng" trong sidebar (không tải lại trang). Kết quả: `401 GET /api/admin/users` hai lần, **không có** `/auth/refresh`, bảng ở trạng thái skeleton mãi. Tải lại trang (F5) thì không thấy lỗi, vì app gọi `/me` trước.
- **Sửa:**
  ```js
  const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
  const canRefresh = url => !NO_REFRESH.some(path => url?.includes(path));
  ```
- **Nghiệm thu:** làm lại bước tái hiện → thấy đúng 1 `200 POST /api/auth/refresh` rồi `200 GET /api/admin/users`, bảng có dữ liệu. Thử thêm: nhiều request cùng 401 → vẫn chỉ 1 lần refresh.

### L2 — Tải file lên khi token hết hạn trả 400 thay vì 401
- **File:** `backend/src/middlewares/upload.js`, hàm `handleUploadError`.
- **Nguyên nhân:** `auth` giờ gọi `next(err)`; `handleUploadError` là middleware xử lý lỗi đứng sau nên bắt luôn lỗi đăng nhập và trả 400. FE không thấy `ACCESS_TOKEN_EXPIRED` nên không refresh, tải file thất bại.
- **Tái hiện:** `POST /api/documents/upload` không có cookie → `400 {"message":"Vui lòng đăng nhập để tiếp tục.","code":400}`.
- **Sửa:** đầu hàm thêm `if (err?.statusCode) return next(err);` để lỗi `AppError` đi tiếp tới `errorHandler`; chỉ xử lý lỗi của multer.
- **Nghiệm thu:** không cookie → 401 `ACCESS_TOKEN_MISSING`; access hết hạn → 401 `ACCESS_TOKEN_EXPIRED` → FE refresh rồi tải lên thành công. Thêm 1 test cho trường hợp này.

## 3. Cần làm trước khi deploy

| # | Việc | Lý do |
|---|---|---|
| D1 | ✅ Đã chạy migration `006_userSessions.sql` lên Supabase và bật RLS (dòng cuối file migration) | Không bật RLS thì ai có anon key cũng đọc/xóa được phiên qua REST |
| D2 | Thêm `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (khác nhau, ≥ 32 ký tự), `CORS_ORIGINS`, `TRUST_PROXY` trên Railway | Thiếu secret thì server **không khởi động** |
| D3 | Thay `frontend/vercel.mjs` bằng `vercel.json` có rewrite `/api/(.*)` → địa chỉ Railway, đặt trước rewrite về `index.html` | Chưa kiểm chứng được Vercel đọc file `.mjs` có `export const config`; `vercel.json` là cách chắc chắn |

## 4. Nên sửa (không chặn merge)

| # | Việc |
|---|---|
| N1 | `REFRESH_RACE` trả 409, kế hoạch ghi 401. FE đã xử lý theo `code` nên chạy đúng; chọn một và ghi lại trong `docs/api.md` |
| N2 | `pages/profile/components/sessionList` dùng class màu cũ `ink-*`, `danger-400`, `primary-300`. Đổi sang token trong `CLAUDE.md` (`fg`, `fg-muted`, `line`, `urgent`, `brand-600`…) · nút "Đăng xuất" thêm `aria-label` ghi tên thiết bị |
| N3 | BE lint tăng 3 cảnh báo `no-param-reassign` trong `utils/AppError.js` — sửa cho bằng `dev` |
| N4 | Phần làm ngoài kế hoạch (94 file): tách `container/` thành 7 file, thư mục `config/`, tự dò route theo tên file + đổi tên 4 file route, đổi mọi service/controller sang `async method`, sửa quy tắc `CLAUDE.md`. Test vẫn qua và URL giữ nguyên, nhưng **chờ chủ dự án quyết** giữ hay tách PR riêng — chưa làm gì thêm ở phần này |

## 5. Chưa kiểm được

- Khối "Thiết bị đăng nhập" trên giao diện (DB giả không nạp được trang hồ sơ) — kiểm lại sau khi sửa, với DB thật hoặc Supabase local.
- Safari / iPhone qua domain Vercel (cần Railway còn chạy).

## 6. Báo lại sau khi sửa

Push lên `feat/authSession`, ghi trong commit hoặc tin nhắn: L1 ✅/❌, L2 ✅/❌, D3 ✅/❌, N1–N3 ✅/❌, kèm log Network cho bước nghiệm thu L1.

---

# Kiểm tra lần 2 — commit `261474e`

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Test có sẵn | ✅ | BE `test:contract` 31/31 (thêm test upload) · `test:ingestion` 57/57 · BE lint 56 cảnh báo, bằng `dev` · FE lint 0 · FE build qua |
| API thật | ✅ 109/109 | `POST /documents/upload` không token → 401; `REFRESH_RACE` trả 409 như `docs/api.md` |
| **L1** refresh khi đang dùng app | ✅ | Bấm "Người dùng" khi access hết hạn: `401 GET /api/admin/users` → `200 POST /api/auth/refresh` → `200 GET /api/admin/users`. 5 request hết hạn cùng lúc → đúng **1** lần refresh, 4 request GET trả 200 |
| **L2** upload khi hết hạn | ✅ | `401 POST /documents/upload` → refresh → gửi lại qua được `auth` và multer, vào tới controller (500 ở bước lưu file là do môi trường test không có Supabase Storage) |
| D3 `vercel.json` | ⚠️ chưa kiểm chứng | Dùng `routes` + `"dest": "${BACKEND_URL}/api/$1"` + `"env": ["BACKEND_URL"]`. Chưa xác nhận được Vercel có thay biến môi trường trong `vercel.json` hay không → **thử trên bản Preview của Vercel trước**; không chạy thì ghi thẳng địa chỉ Railway vào `dest` |
| N1 mã 409 | ✅ | đã ghi trong `docs/api.md` |
| N2 màu `sessionList` | ✅ | dùng `line`, `fg`, `fg-muted`, `brand-600`, `urgent-*`; nút có `aria-label` |
| N3 lint | ✅ | về lại 56 cảnh báo như `dev` |
| Local dev | ✅ | FE gọi `/api`, Vite chuyển tiếp tới `localhost:3001`; đăng nhập, phân quyền, 3 thiết bị chạy đúng qua proxy |
| N4 phần ngoài kế hoạch | ⏸ chờ chủ dự án | đề xuất gộp `container/` (7 file) về một `container.js` |

**Còn lại trước khi deploy:** D2 (secret + `CORS_ORIGINS` trên Railway, thêm `BACKEND_URL` trên Vercel) và thử D3 trên Preview.
