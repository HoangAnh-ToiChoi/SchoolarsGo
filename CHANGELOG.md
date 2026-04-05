# ScholarsGo — Backend Supabase Integration & Cloud Seed

**Branch:** `backend-supabase-seed`
**Created:** 2026-03-31
**Author:** Generated with AI Assistant

---

## Tổng quan

Branch này tích hợp Supabase Cloud làm database backend và bổ sung script seed dữ liệu học bổng thực tế từ nguồn [scholars4dev.com](https://www.scholars4dev.com).

---

## Các thay đổi chính

### 1. Supabase Client (`backend/src/utils/db.js`) — **MỚI**

Kết nối Supabase Cloud qua biến môi trường. Dùng **service_role key** (bypass RLS) để seed script có quyền ghi không giới hạn.

```
SUPABASE_URL       = https://mthxqvnukejvjadldwob.supabase.co
SUPABASE_ANON_KEY  = <public anon key — client-side>
SUPABASE_SERVICE_ROLE_KEY = <service role key — server-side only, NEVER commit>
```

> **Lưu ý bảo mật:** `SUPABASE_SERVICE_ROLE_KEY` tuyệt đối không commit vào git. Kiểm tra `.env` đã được `.gitignore` hay chưa.

---

### 2. Database Schema (`database.sql`) — **CẬP NHẬT**

#### Migration v0.3 (2026-03-31)

Hai câu SQL migrate trên Supabase Dashboard:

```sql
-- 1. Thêm unique constraint trên title
ALTER TABLE scholarships ADD CONSTRAINT scholarships_title_key UNIQUE (title);

-- 2. Tăng country VARCHAR(100→255) để chứa dữ liệu scrape dài
ALTER TABLE scholarships ALTER COLUMN country TYPE VARCHAR(255);
```

**Lý do:** Script seed dùng `ON CONFLICT (title) DO NOTHING` nên cần constraint trên `title`. Nếu bạn chạy seed mà gặp lỗi `there is no unique or exclusion constraint matching the ON CONFLICT specification`, hãy chạy 2 câu SQL trên trong Supabase SQL Editor.

---

### 3. Backend Services (`backend/src/services/`)

| File | Mô tả |
|------|-------|
| `auth.service.js` | Xác thực: register, login, đổi password |
| `profile.service.js` | CRUD hồ sơ user |
| `scholarship.service.js` | CRUD học bổng, filter/search |
| `application.service.js` | Quản lý đơn ứng tuyển |
| `saved.service.js` | Lưu/tracking học bổng |
| `document.service.js` | Upload tài liệu |
| `recommend.service.js` | Gợi ý học bổng cá nhân hóa |

---

### 4. Seed Script (`backend/scripts/seed-cloud.js`) — **MỚI**

Đổ dữ liệu học bổng từ `scholars4dev.com` vào Supabase Cloud.

#### Cách chạy

```bash
cd backend
npm install
node scripts/seed-cloud.js
```

#### Quy trình hoạt động

```
1. Kết nối Supabase → kiểm tra số học bổng hiện tại
2. Thử RSS feed (thường trả về 0 → fallback)
3. Fallback: scrape 5 categories bằng axios + cheerio
   - masters-scholarships
   - phd-scholarships
   - fully-funded-scholarships
   - undergraduate-scholarships
   - scholarships-in-usa-for-international-students
4. Deduplicate theo title (so sánh string đã lowercase + trim)
5. Upsert batch 50 bản ghi vào Supabase
6. Báo cáo kết quả
```

#### Các lỗi thường gặp khi chạy lại seed

| Lỗi | Nguyên nhân | Cách xử lý |
|------|------------|------------|
| `ON CONFLICT specification` | Chưa chạy migration | Chạy 2 câu ALTER TABLE trong SQL Editor |
| `value too long for VARCHAR(255)` | Trường dữ liệu quá dài | Đã xử lý bằng `normalizeForDB()` truncate |
| `null value in column "deadline"` | Thiếu deadline | Script tự gán mặc định +1 năm |
| `23505 unique_violation` | Trùng title | `ON CONFLICT (title) DO NOTHING` bỏ qua |

#### Kết quả seed lần đầu (2026-03-31)

```
✅ Inserted : 66 bản ghi
⏭️  Skipped : 0
❌ Errors  : 0
📊 Tổng học bổng active trong DB : 66
```

---

### 5. Package Dependencies (`backend/package.json`)

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "axios": "^1.6.0",
  "cheerio": "^1.0.0",
  "dotenv": "^16.4.0",
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "multer": "^1.4.5-lts.1",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3"
}
```

---

## Checklist cho đồng đội

- [ ] Clone repo → `npm install` trong `backend/`
- [ ] Copy `.env.example` → `.env` → điền `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Chạy 2 câu migration SQL trên Supabase Dashboard (xem mục 2)
- [ ] Chạy `node scripts/seed-cloud.js` để seed dữ liệu ban đầu
- [ ] Start backend: `node src/index.js`

---

## Supabase Project Info

- **Project URL:** https://mthxqvnukejvjadldwob.supabase.co
- **Region:** Châu Á (Asia)
- **Tables:** users, scholarships, applications, saved_scholarships, documents, profiles

---

## Gitignore cần kiểm tra

Đảm bảo các file sau **KHÔNG** bị commit:

```
backend/.env
backend/node_modules/
```

Kiểm tra: `git diff .gitignore` hoặc mở file `.gitignore`.
