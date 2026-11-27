> **Lưu ý:** tài liệu này viết khoảng 04–05/2026 (trước đây là `docs/memory*.md`) và có thể lệch với code hiện tại. Khi khác nhau, code là đúng.

# ============================================================
# SCHOLARSGO — DATABASE SCHEMA
# ============================================================
# Last Updated: 2/5/2026

---

## Tổng quan

| Database | Provider | Connection |
|----------|----------|------------|
| PostgreSQL | Supabase | Raw pg Pool (`src/config/database.config.js`) | Raw SQL — không Supabase SDK cho API |

---

## Tables

### 1. users

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| email | varchar(255) | UNIQUE, NOT NULL | Email đăng nhập |
| password_hash | varchar(255) | NOT NULL | Bcrypt hash |
| full_name | varchar(255) | NOT NULL | Họ tên đầy đủ |
| avatar_url | text | NULLABLE | URL avatar |
| phone | varchar(20) | NULLABLE | Số điện thoại |
| date_of_birth | date | NULLABLE | Ngày sinh |
| role | varchar(20) | NOT NULL, DEFAULT 'user' | Vai trò: `user`, `admin` |
| last_login_at | timestamptz | NULLABLE | Thời điểm đăng nhập gần nhất |
| realtime_topic | uuid | NOT NULL, DEFAULT gen_random_uuid() | Tên kênh Supabase Realtime của chuông (migration 010), ngẫu nhiên để không đoán được |
| created_at | timestamp | DEFAULT now() | Thời điểm tạo |
| updated_at | timestamp | DEFAULT now() | Thời điểm cập nhật |

**Indexes:** `CREATE INDEX idx_users_email ON users(email);`

**Mặc định role:** Mọi user mới đăng ký đều có `role = 'user'`. Chỉ `admin` mới có quyền truy cập dashboard quản trị.

---

### 2. profiles

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| user_id | uuid | FK → users.id, UNIQUE, NOT NULL | Liên kết user |
| bio | text | NULLABLE | Giới thiệu bản thân |
| gpa | decimal(3,2) | NULLABLE, CHECK (0 <= gpa <= 4) | GPA (thang 4.0) |
| gpa_scale | varchar(10) | NULLABLE, DEFAULT '4.0' | Thang điểm gốc |
| english_level | varchar(50) | NULLABLE | Trình độ tiếng Anh (IELTS, TOEFL...) |
| target_country | varchar(100) | NULLABLE | Quốc gia muốn đến |
| target_major | varchar(255) | NULLABLE | Ngành học mong muốn |
| target_degree | varchar(50) | NULLABLE | Bậc học (Bachelor, Master, PhD) |
| target_intake | varchar(50) | NULLABLE | Kỳ nhập học dự kiến |
| created_at | timestamp | DEFAULT now() | Thời điểm tạo |
| updated_at | timestamp | DEFAULT now() | Thời điểm cập nhật |

**Indexes:**
- `CREATE INDEX idx_profiles_user_id ON profiles(user_id);`
- `CREATE INDEX idx_profiles_gpa ON profiles(gpa);`

---

### 3. documents

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| user_id | uuid | FK → users.id, NOT NULL | Liên kết user |
| type | varchar(50) | NOT NULL | Loại: cv, sop, transcript, recommendation_letter, other |
| file_name | varchar(255) | NOT NULL | Tên file gốc |
| storage_path | text | | Đường dẫn trong bucket private `documents`: `{user_id}/{type}/{tên}_{8 ký tự}.{đuôi}` (migration 013) |
| file_url | text | | Chỉ còn ở bản ghi trước 013 (URL công khai cũ). API trả `file_url` là link ký có hạn 1 giờ |
| file_size | integer | NOT NULL | Kích thước (bytes) |
| mime_type | varchar(100) | NOT NULL | MIME đọc từ byte đầu file (không theo Content-Type client gửi) |
| is_verified | boolean | DEFAULT false | Đã được xác minh |
| created_at | timestamp | DEFAULT now() | Thời điểm tạo |

**Indexes:**
- `CREATE INDEX idx_documents_user_id ON documents(user_id);`
- `CREATE INDEX idx_documents_type ON documents(type);`

---

### 4. scholarships

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| title | varchar(500) | NOT NULL | Tên học bổng |
| provider | varchar(255) | NOT NULL | Đơn vị cấp (trường/tổ chức) |
| country | varchar(100) | NOT NULL | Quốc gia |
| city | varchar(255) | NULLABLE | Thành phố |
| university | varchar(255) | NULLABLE | Trường đại học |
| degree | varchar(50) | NOT NULL | Bậc học (Bachelor, Master, PhD, Any) |
| field_of_study | varchar(255) | NULLABLE | Ngành học |
| amount | decimal(12,2) | NULLABLE | Số tiền học bổng |
| currency | varchar(10) | DEFAULT 'USD' | Đơn vị tiền tệ |
| coverage | varchar(255) | NULLABLE | Phạm vi: Full, Partial, Tuition, Stipend |
| deadline | timestamp | NOT NULL | Hạn nộp |
| intake | varchar(50) | NULLABLE | Kỳ nhập học |
| language | varchar(50) | NULLABLE | Ngôn ngữ giảng dạy |
| min_gpa | decimal(3,2) | NULLABLE | GPA tối thiểu (thang 4.0) |
| min_ielts | decimal(2,1) | NULLABLE | IELTS tối thiểu |
| eligibility | text | NULLABLE | Điều kiện ứng tuyển |
| requirements | text | NULLABLE | Hồ sơ yêu cầu |
| benefits | text | NULLABLE | Quyền lợi |
| application_url | text | NULLABLE | Link nộp đơn |
| image_url | text | NULLABLE | Ảnh banner |
| is_featured | boolean | DEFAULT false | Nổi bật |
| admin_locked_at | timestamptz | | Admin đã sửa hoặc ẩn: lượt kéo tự động không ghi đè, không bật lại (migration 014) |
| is_active | boolean | DEFAULT true | Còn hạn |
| source | varchar(100) | NULLABLE | Nguồn (scholars4dev, own...) |
| created_at | timestamp | DEFAULT now() | Thời điểm tạo |
| updated_at | timestamp | DEFAULT now() | Thời điểm cập nhật |

**Indexes:**
- `CREATE INDEX idx_scholarships_country ON scholarships(country);`
- `CREATE INDEX idx_scholarships_degree ON scholarships(degree);`
- `CREATE INDEX idx_scholarships_deadline ON scholarships(deadline);`
- `CREATE INDEX idx_scholarships_field ON scholarships(field_of_study);`
- `CREATE INDEX idx_scholarships_language ON scholarships(language);`
- `CREATE INDEX idx_scholarships_min_gpa ON scholarships(min_gpa);`
- Migration `009_searchIndexes.sql`: GIN trigram `idx_scholarships_title_trgm`, `idx_scholarships_provider_trgm` (tìm kiếm `ILIKE '%…%'`); `idx_scholarships_active_relevance_deadline` `(relevance_score DESC, deadline ASC NULLS LAST) WHERE is_active` (thứ tự mặc định của danh sách, nổi bật).

---

### 5. applications

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| user_id | uuid | FK → users.id, NOT NULL | User ứng tuyển |
| scholarship_id | uuid | FK → scholarships.id, NOT NULL | Học bổng ứng tuyển |
| status | varchar(50) | DEFAULT 'draft' | draft, submitted, under_review, interview, accepted, rejected, withdrawn |
| applied_at | timestamp | NULLABLE | Ngày nộp |
| notes | text | NULLABLE | Ghi chú cá nhân |
| checklist | jsonb | DEFAULT '[]' | Checklist hồ sơ |
| documents_used | jsonb | DEFAULT '[]' | Danh sách document IDs đã dùng |
| result | text | NULLABLE | Kết quả chi tiết |
| created_at | timestamp | DEFAULT now() | Thời điểm tạo |
| updated_at | timestamp | DEFAULT now() | Thời điểm cập nhật |

**Indexes:**
- `CREATE INDEX idx_applications_user_id ON applications(user_id);`
- `CREATE INDEX idx_applications_scholarship_id ON applications(scholarship_id);`
- `CREATE INDEX idx_applications_status ON applications(status);`

**Unique constraint:** `UNIQUE(user_id, scholarship_id)` — 1 user chỉ ứng tuyển 1 lần cho 1 học bổng

---

### 6. saved_scholarships

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| user_id | uuid | FK → users.id, NOT NULL | User lưu |
| scholarship_id | uuid | FK → scholarships.id, NOT NULL | Học bổng |
| note | text | NULLABLE | Ghi chú riêng |
| created_at | timestamp | DEFAULT now() | Thời điểm lưu |

**Unique constraint:** `UNIQUE(user_id, scholarship_id)`
**Indexes:** `CREATE INDEX idx_saved_user_id ON saved_scholarships(user_id);`

---

### 7. notifications

Migration `005_notifications.sql`. Thông báo trên chuông header.

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| id | uuid | PK | Primary key |
| user_id | uuid | FK → users.id, NOT NULL, ON DELETE CASCADE | Người nhận |
| type | varchar(20) | CHECK in ('deadline', 'new_match') | Nhắc hạn / học bổng mới phù hợp (giai đoạn 3) |
| scholarship_id | uuid | FK → scholarships.id, NOT NULL | Học bổng liên quan |
| application_id | uuid | FK → applications.id, NULLABLE | Có khi nhắc theo đơn nháp |
| milestone | smallint | DEFAULT 0 | Mốc nhắc 14 / 7 / 1 ngày |
| read_at | timestamptz | NULLABLE | Thời điểm đọc; NULL = chưa đọc |
| created_at | timestamptz | DEFAULT now() | |

**Unique constraint:** `UNIQUE(user_id, type, scholarship_id, milestone)` — mỗi mốc chỉ nhắc một lần.
**Indexes:** `(user_id, created_at DESC)`, `(user_id) WHERE read_at IS NULL`.
**Realtime (migration `010_realtimeSignals.sql`):** trigger theo câu lệnh `trg_signal_notifications_inserted` gửi `realtime.send('{}', 'notification', 'user:' || users.realtime_topic, false)` cho mỗi người có thông báo mới; `trg_signal_scholarships_inserted` trên `scholarships` gửi `{ count }` lên kênh `scholarships`. Gửi lỗi chỉ `WARNING`, không làm hỏng INSERT.

### 8. user_sessions

Migration `006_userSessions.sql`. Mỗi dòng là một thiết bị đăng nhập; database chỉ giữ SHA-256 của refresh token hiện tại và token liền trước để xoay vòng an toàn.

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | Session ID (`sid` trong access token) |
| user_id | uuid | FK → users.id, ON DELETE CASCADE | Chủ phiên |
| refresh_token_hash | text | NOT NULL | SHA-256 refresh token hiện tại |
| previous_token_hash | text | NULLABLE | Hash token trước lần xoay gần nhất |
| rotated_at | timestamptz | NULLABLE | Lần xoay gần nhất |
| device_name | text | NULLABLE | Tên suy từ User-Agent |
| last_used_at | timestamptz | NOT NULL, DEFAULT now() | Lần refresh gần nhất |
| expires_at | timestamptz | NOT NULL | Hạn refresh token |
| revoked_at | timestamptz | NULLABLE | Thời điểm thu hồi |
| revoked_reason | text | NULLABLE | Lý do thu hồi |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Thời điểm tạo |

**Indexes:** partial `(user_id, last_used_at DESC) WHERE revoked_at IS NULL`; `(expires_at)`.
Giới hạn ba thiết bị được áp dụng trong một transaction khóa dòng user; job dọn xóa phiên hết hạn và phiên bị thu hồi quá bảy ngày.

---

## RLS (Row Level Security)

Migration `011_rlsLockdown.sql` (25/11/2026): **mọi bảng bật RLS, không có policy nào**, quyền bảng của `anon` / `authenticated` bị thu.

- Vì sao: app dùng auth tự viết (bảng `users` + JWT riêng), không dùng Supabase Auth. Các policy cũ theo `auth.uid()` vô nghĩa (luôn NULL), còn `scholarships_admin_insert` / `_update` (`WITH CHECK (true)`) cho khóa anon công khai thêm / sửa học bổng.
- Backend không bị ảnh hưởng: supabase-js dùng service role (bỏ qua RLS), pool `pg` đăng nhập bằng chủ bảng.
- Quyền theo người dùng (`user_id`) do backend kiểm (CLAUDE.md 4.7), không dựa vào RLS.
- Bảng mới: `ENABLE ROW LEVEL SECURITY`, không tạo policy. Kiểm bằng `npm run test:integration` (`backend/tests/integration/rlsLockdown.test.js`) trên Supabase local.

---

## Seeding Plan

- Target: 500+ scholarships trước tuần 6 (6/5/2026)
- Nguồn seed: scholarships4dev.com RSS, web scraping, manual entry
- Script: `backend/scripts/ingest.js`
- **Trạng thái: ✅ Phase 1 hoàn thành — 53 scholarships đã seed (27/3/2026)**

### Đã seed phase 1 (27/3/2026): 53 records
| # | Quốc gia | Bậc học | Ghi chú |
|---|----------|---------|---------|
| 1-8 | USA | Bachelor/Master/PhD/Any | Fulbright, Harvard, MIT, Stanford, Yale... |
| 9-14 | UK | Master/PhD | Chevening, Rhodes, Gates Cambridge, LSE... |
| 15-17 | Australia | Master | Australia Awards, Melbourne, ANU |
| 18-21 | Canada | Bachelor/PhD | Vanier, Lester Pearson, UBC, McGill |
| 22-25 | Germany | Master | DAAD Helmut Schmidt, EPOS, Heinrich Böll... |
| 26-28 | Netherlands | Master | Holland Scholarship, Erasmus Mundus, TU Delft |
| 29-30 | France | Master | Éiffel, PSL University |
| 31-33 | Japan | Master/PhD | MEXT, Kyoto, University of Tokyo |
| 34-36 | Singapore | Bachelor/Master/PhD | NUS ASEAN, NUSGS, Lee Kuan Yew |
| 37-38 | Sweden | Master | Swedish Institute, Uppsala |
| 39-40 | Ireland | Master | GoI, Trinity College |
| 41 | Switzerland | PhD | Swiss Government Excellence |
| 42-43 | New Zealand | Master | NZIS, Auckland |
| 44 | Belgium | Master | VLIR-UOS |
| 45 | Finland | Master | Helsinki |
| 46 | Norway | Master | UiO |
| 47 | South Korea | Master | KGSP |
| 48 | Austria | Master | ADC |
| 49 | Spain | PhD | La Caixa INPhINIT |
| 50 | Italy | Master | Politecnico di Milano |
| 51 | China | Master | CSC |
| 52 | Taiwan | Master | ICDF |
| 53 | Poland | Master | NAWA |

### Tiếp theo cần seed thêm ~447 records để đạt target 500+

---

## Migration Log

| Date | Version | Changes |
|------|---------|---------|
| 26/3/2026 | v0.1 | Initial schema — 6 tables created |
| 27/3/2026 | v0.2 | Deploy lên Supabase local Docker. Thêm: RLS policies đầy đủ, auto-update `updated_at` trigger, indexes mở rộng. 6 tables + 16 indexes + 20 policies. |
| 20/4/2026 | v0.3 | Refactor toàn bộ backend sang OOP 4-layer architecture (Scholarship, Profile, Document modules). Thêm DocumentRepository, container.js wiring đầy đủ. |
| 2/5/2026 | v0.4 | Thêm 2 cột vào bảng `users`: `role` (varchar, DEFAULT 'user') và `last_login_at` (timestamptz). Refactor Auth module hoàn tất OOP 4 tầng với EventBus. Hợp nhất Auth V1+V2 tại `/api/auth/*`. |
| 13/11/2026 | v0.5 | Thêm `user_sessions` để xoay refresh token, giới hạn 3 thiết bị và thu hồi phiên. |

## Supabase Cloud Setup

Dự án dùng Supabase Cloud (không còn dùng Docker):

1. Tạo project ở supabase.com.
2. Điền `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` và các biến `PG_*` vào `backend/.env` (xem `backend/.env.example`).
3. Tạo bảng: trong `backend/` chạy `npm run migrate -- --allow-remote` (chạy `scripts/migrations/000_baseline.sql` → mới nhất, ghi lại vào bảng `schema_migrations`). DB đã dựng tay từ trước thì cứ chạy thường: mọi file chạy lại không lỗi, phần còn thiếu được bù. Xem trước bằng `--dry-run` (không ghi gì).

Dựng DB trên máy (Supabase local) để thử và chạy test tích hợp: `docs/lab.md`.
4. Xem dữ liệu bằng Supabase Dashboard → Table Editor.

---

## Backend OOP Architecture (cập nhật 20/4/2026)

> **Nguồn:** Các nhánh `feature/scholarships-oop`, `feature/profile-oop`, `feature/document-oop`

### Nguyên tắc 4-Layer (bất biến)

```
Routes → Controller → Service → Repository → DB
```

| Layer | Trách nhiệm | Quy tắc |
|-------|-------------|----------|
| **Controller** | HTTP handling, parse req/res | KHÔNG chứa business logic hay SQL |
| **Service** | Business logic, validation, rollback | KHÔNG chứa SQL, nhận model qua constructor (có giá trị mặc định) |
| **Repository** | Toàn bộ SQL của module | Kế thừa `BaseRepository`, KHÔNG SQL ở tầng khác |
| **DB** (`configs/database.config.js`) | Raw pg Pool, `query()` + `queryOne()` | Singleton, inject vào Repository |

### Kết nối các tầng (không còn `container.js`)

- Mỗi tầng tự tạo tầng dưới bằng tham số mặc định của constructor: `constructor(model = new ProfileModel())`.
- Route tạo controller một lần ở đầu file và bind method bằng `utils/bindControllerMethods`.
- Test truyền model giả vào constructor của service.

```
Supabase client / pg Pool → XModel → XService → XController
```

### Quy tắc viết Class

- **Constructor:** nhận dependency qua tham số (không import trực tiếp bên trong class)
- **Public async methods:** `async function` expressions (`methodName = async function methodName(params) {}`). Bind controller handlers before passing them to Express.
- **Private methods/helpers:** dùng `#methodName` (JS private field syntax)
- **Error helper:** `#throwError(message, statusCode)` — throw Error có `.statusCode` và `.isOperational = true`
- **Guard helper:** `#ensureFound(item, message)` — throw 404 nếu item null

### Module: Scholarship (`feature/scholarships-oop`)

**Commits:** `781ebbc` → `6f860c9`

**ScholarshipRepository** — `backend/src/repositories/scholarship.repository.js`

| Method | Mô tả |
|--------|--------|
| `findAll(filters, userId)` | Danh sách có filter + pagination + `is_saved`. Trả `{ data, meta }` |
| `findFeatured()` | Lấy 6 học bổng nổi bật (`is_featured=true`, deadline còn hạn) |
| `findCountries()` | Danh sách country distinct |
| `findById(id, userId)` | Chi tiết 1 học bổng + `is_saved` flag |
| `#buildWhereClause(filters)` | Nội bộ: xây WHERE clause từ filters object |
| `#attachSavedStatus(rows, userId)` | Nội bộ: batch check saved_scholarships |
| `#checkSavedStatus(userId, scholarshipId)` | Nội bộ: check 1 scholarship có được save không |

**Filters hỗ trợ:** `country`, `degree`, `field`, `language`, `min_gpa`, `min_ielts`, `deadline_from`, `deadline_to`, `amount_min`, `coverage`, `featured`, `search`, `page`, `limit` (max 50)

**ScholarshipService** — `backend/src/services/scholarship.service.js`

| Method | Mô tả |
|--------|--------|
| `getAll(filters, userId)` | Gọi `repo.findAll()` |
| `getFeatured()` | Gọi `repo.findFeatured()` |
| `getCountries()` | Gọi `repo.findCountries()` |
| `getById(id, userId)` | Gọi `repo.findById()`, throw 404 nếu không có |

---

### Module: Profile (`feature/profile-oop`)

**Commits:** `16d0039` → `23fe92f`

**ProfileRepository** — `backend/src/repositories/profile.repository.js`

| Method | Mô tả |
|--------|--------|
| `findByUserId(userId)` | Lấy profile + documents, tự tạo profile nếu chưa có (upsert) |
| `upsertProfile(userId, updates)` | INSERT … ON CONFLICT DO UPDATE. Nếu có `full_name` → sync sang bảng `users` |
| `#buildProfileUpdateSets(updates)` | Nội bộ: whitelist + extract values từ updates |

**Whitelist fields được phép update:** `bio`, `gpa`, `gpa_scale`, `english_level`, `target_country`, `target_major`, `target_degree`, `target_intake`

**ProfileService** — `backend/src/services/profile.service.js`
- Không có SQL, chỉ gọi `profileRepo` methods
- Nhận `profileRepository` qua constructor

**ProfileController** — `backend/src/controllers/profile.controller.js`
- Class + async function expressions
- Inject `profileService` qua constructor
- Route tạo controller và bind method

---

### Module: Document (`feature/document-oop`)

**Commit:** `f0aff4e` — 20/4/2026 17:02 (commit mới nhất)

**DocumentRepository** — `backend/src/repositories/document.repository.js`

| Method | Mô tả |
|--------|--------|
| `findAllByUserId(userId)` | SELECT * documents ORDER BY created_at DESC |
| `findByIdAndUserId(id, userId)` | Ownership check — trả `null` nếu không tìm thấy |
| `insertDocument({ userId, docType, fileName, fileUrl, fileSize, mimeType })` | INSERT RETURNING * |
| `deleteByIdAndUserId(id, userId)` | Tìm + xóa record, trả về `storagePath` để Service xóa file vật lý |
| `#extractStoragePath(publicUrl)` | Nội bộ: parse Supabase Storage URL → `documents/uuid/type/file.ext` |

**DocumentService** — `backend/src/services/document.service.js`

| Method | Mô tả |
|--------|--------|
| `getAll(userId)` | Lấy danh sách documents |
| `upload(userId, docType, file)` | Validate type + file → upload Storage → insert DB. Nếu DB lỗi → rollback xóa file |
| `remove(userId, documentId)` | Tìm doc → xóa file Storage → xóa DB record |

**Valid document types:** `cv`, `sop`, `transcript`, `recommendation_letter`, `other`

**Upload rollback pattern:**
```js
// Nếu insertDocument thất bại, tự động xóa file đã upload:
await deleteFile(uploadResult.storagePath);
```

**DocumentController** — `backend/src/controllers/document.controller.js`
- Class + async function expressions, inject `documentService` qua constructor
- Route tạo controller và bind method

**Document Routes** — `backend/src/routes/document.routes.js`

| Method | Route | Middleware | Handler |
|--------|-------|------------|---------|
| GET | `/api/documents` | `auth` | `documentController.getAll` |
| POST | `/api/documents/upload` | `auth, upload.single('file'), handleUploadError` | `documentController.upload` |
| DELETE | `/api/documents/:id` | `auth` | `documentController.remove` |

> **Lưu ý `handleUploadError`:** Phải đặt sau `upload.single('file')` để bắt lỗi `MulterError` và format JSON 400 thay vì crash server.

---

### Cấu trúc thư mục Backend (sau OOP refactor)

```
backend/src/
├── controllers/
│   ├── document.controller.js
│   ├── profile.controller.js
│   └── scholarship.controller.js
├── services/
│   ├── document.service.js
│   ├── profile.service.js
│   ├── scholarship.service.js
│   ├── application-v2.service.js
├── repositories/
│   ├── base.repository.js    ← Base class kế thừa
│   ├── document.repository.js
│   ├── profile.repository.js
│   ├── scholarship.repository.js
│   └── application.repository.js
├── routes/
│   ├── document.routes.js
│   ├── profile.routes.js
│   └── scholarship.routes.js
└── utils/
    ├── db.js                 ← Raw pg Pool singleton
    └── responseHelper.js     ← success(), created() helpers
```
