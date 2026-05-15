# ScholarsGo — Vấn đề kết nối & Fix Log

## 1. Frontend — 401 Interceptor Bug

**Triệu chứng:** Đăng nhập sai mật khẩu → trang reload, không hiện toast lỗi. Hiển thị "Lỗi máy chủ" hoặc trang trắng.

**Nguyên nhân:** `frontend/src/services/api.js` — interceptor 401 gọi `window.location.href = '/login'` vô điều kiện, kể cả khi đang ở trang `/login`. Trang reload trước khi toast kịp hiển thị.

**Fix:** ✅ Đã fix — kiểm tra pathname trước khi redirect:
```js
const onAuthPage = ['/login', '/register'].some(p => window.location.pathname.startsWith(p));
if (!onAuthPage) {
  useAuthStore.getState().logout();
  window.location.href = '/login';
}
```

---

## 2. Backend — Không kết nối được Supabase Cloud

**Triệu chứng:** `Error: getaddrinfo ENOENT db.mthxqvnukejvjadldwob.supabase.co` — toàn bộ API trả 500.

### Phân tích từng tầng

| Tầng | Kết quả | Ghi chú |
|------|---------|---------|
| DNS lookup hostname | ✅ Resolve được | Trả về IPv6: `2406:da1a:6b0:f61d:...` |
| A record (IPv4) | ❌ Không có | Supabase chỉ có AAAA record cho direct connection |
| AAAA record (IPv6) | ✅ Có | Nhưng TCP port 5432 bị chặn |
| TCP port 5432 | ❌ Blocked | ISP/router chặn port PostgreSQL |
| TCP port 6543 (pooler) | ✅ Accessible | Transaction Mode Pooler hoạt động |

**Nguyên nhân gốc:** ISP/router nhà chặn port 5432. Đây là hành vi phổ biến — nhiều nhà mạng block port database để bảo mật. Supabase direct connection (`db.xxx.supabase.co:5432`) không dùng được trong môi trường này.

**Các fix đã thử:**

| Fix | Kết quả | Lý do |
|-----|---------|-------|
| `PG_DNS_FAMILY=4` (force IPv4) | ❌ | Hostname không có A record IPv4 |
| `PG_DNS_FAMILY=0` (auto) | ❌ | Có IPv6 address nhưng port 5432 bị block |
| `PG_DNS_FAMILY=6` (force IPv6) | ❌ | Port 5432 bị block |
| Docker local (`localhost:5432`) | ✅ | Kết nối nội bộ, không qua internet |
| **Supabase Transaction Pooler port 6543** | ✅ | Port 6543 không bị block |

**Fix hiện tại — dùng Transaction Mode Pooler:**
```env
PG_HOST=aws-0-ap-southeast-1.pooler.supabase.com
PG_PORT=6543
PG_DATABASE=postgres
PG_USER=postgres.mthxqvnukejvjadldwob
PG_PASSWORD=Diem10DOANCOSO
PG_SSL=true
PG_DNS_FAMILY=4
```

> **Lưu ý Transaction Mode Pooler:** Không hỗ trợ named prepared statements và session-level `SET` commands. Code hiện tại dùng plain `pool.query()` nên tương thích.

---

## 3. Backend — CORS sai port frontend

**Triệu chứng:** API call từ frontend bị block, toast "Không thể kết nối máy chủ".

**Nguyên nhân:** `FRONTEND_URL` trong `.env` set sai port. Khi frontend chạy trên port 5174 (5173 bị chiếm) nhưng CORS chỉ allow 5173.

**Fix:** ✅ Đảm bảo `FRONTEND_URL` khớp với port frontend đang chạy:
```env
FRONTEND_URL=http://localhost:5173
```

---

## 4. Supabase Free Tier — Project Pause

**Triệu chứng:** Sau 1 tuần không hoạt động, Supabase free tier tự động pause project. Mọi kết nối fail.

**Fix:** Vào `app.supabase.com` → chọn project → **Resume/Restore project**. Chờ ~2-3 phút để khởi động lại.

---

## Tóm tắt cấu hình `.env` hiện tại (hoạt động)

```env
FRONTEND_URL=http://localhost:5173

PG_HOST=aws-0-ap-southeast-1.pooler.supabase.com
PG_PORT=6543
PG_DATABASE=postgres
PG_USER=postgres.mthxqvnukejvjadldwob
PG_PASSWORD=Diem10DOANCOSO
PG_SSL=true
PG_DNS_FAMILY=4
```

## Fallback — Docker Local (khi không có internet)

```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=scholarsgo
PG_USER=postgres
PG_PASSWORD=scholarsgo_password
PG_SSL=false
```

Chạy: `docker-compose up -d` trước khi start backend.
