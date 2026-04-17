# ============================================================
# SCHOLARSGO — FEATURES & BUSINESS LOGIC
# ============================================================
# Last Updated: 17/4/2026

---

## 0. Auth — User Authentication (Week 3)

**Trạng thái:** ✅ Hoàn thành (4/4/2026)

### Mô tả
Hệ thống xác thực người dùng bằng email/password với JWT token, sử dụng thư viện `bcryptjs` để băm mật khẩu và `jsonwebtoken` để tạo/verify token.

### Tech Stack
- **Password hashing:** `bcryptjs` với salt rounds = 12
- **Token:** `jsonwebtoken`, payload: `{ id, email }`, expires: `JWT_EXPIRES_IN` env (mặc định `7d`)
- **Database access:** Raw SQL với parameterized queries (`$1, $2, ...`) — KHÔNG dùng Supabase SDK cho auth
- **Connection pool:** PostgreSQL qua `src/utils/db.js`
- **Rate limiting:** `express-rate-limit`, áp dụng ở route-level

### File Structure
```
src/
├── controllers/auth.controller.js   ← request handlers (gọi service)
├── services/auth.service.js         ← business logic, raw SQL, bcrypt, jwt
├── routes/auth.routes.js            ← route definitions + rate limiter wiring
├── middlewares/auth.js              ← JWT verification middleware
└── utils/validators.js              ← Zod schemas cho register/login
```

### User Flow

```
User → Register Page → POST /api/auth/register
  → Zod validate { email, password(min 6), full_name }
  → Check email tồn tại chưa (SELECT WHERE email = $1)
  → bcrypt.hash(password, 12)
  → INSERT INTO users ($1, $2, $3)
  → jwt.sign({ id, email }, JWT_SECRET, { expiresIn })
  → Return { user, token } + 201

User → Login Page → POST /api/auth/login
  → Zod validate { email, password }
  → SELECT user WHERE email = $1
  → bcrypt.compare(password, hash)
  → jwt.sign({ id, email }, JWT_SECRET, { expiresIn })
  → Return { user, token } + 200

User → Protected Route → GET /api/auth/me
  → Auth middleware: verify JWT from Bearer header / cookie
  → req.user = { id, email }
  → Return user data + 200
```

### Rate Limiting
| Endpoint | Limit | Reason |
|----------|-------|--------|
| POST /api/auth/register | 3 req/phút/IP | Chống spam đăng ký |
| POST /api/auth/login | 5 req/phút/IP | Chống brute-force |

### Security Considerations
- Password được hash bằng bcryptjs (salt rounds = 12) — KHÔNG bao giờ lưu plain-text
- SQL injection prevented bằng parameterized queries (`$1, $2`)
- JWT verified trong auth middleware; invalid/expired token → 401
- User chỉ có thể truy cập route `/me` khi có token hợp lệ

### Edge Cases
| Scenario | Handling |
|----------|----------|
| Email đã tồn tại khi register | 409 Conflict: "Email đã được sử dụng" |
| Sai email hoặc password khi login | 401 Unauthorized: "Email hoặc mật khẩu không đúng" |
| Token expired | 401: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" |
| Token không hợp lệ | 401: "Token không hợp lệ" |
| Không có token | 401: "Vui lòng đăng nhập để tiếp tục" |

---

## 1. Scholarship Search (P0 Feature #1)

**Trạng thái:** ✅ Hoàn thành (4/4/2026)

### Mô tả
Cho phép user tìm kiếm và filter học bổng theo nhiều tiêu chí: quốc gia, bậc học, ngành, GPA, deadline, ngôn ngữ... với phân trang. Dùng raw SQL + parameterized queries trực tiếp PostgreSQL (không Supabase SDK).

### User Flow

```
User → Landing Page → Scholarship Search Page
  → Chọn filter(s) → Submit
  → FE gọi GET /api/scholarships?country=UK&degree=Master...
  → BE query Supabase với WHERE clauses
  → BE trả về paginated results
  → FE hiển thị cards với pagination
```

### Data Flow

```
FE: ScholarshipSearchPage.jsx
  → scholarshipService.getScholarships({ filters })
    → axios.get('/api/scholarships', { params: filters })
      → BE: GET /api/scholarships
        → scholarshipsController.getAll(req, res)
          → scholarshipService.getAll(filters)
            → Dynamic SQL: WHERE is_active = true AND deadline > NOW() + filters
            → SELECT COUNT(*) → total (for pagination meta)
            → SELECT ... LIMIT $limit OFFSET $offset → paginated rows
          → return { success: true, data: [...], meta: { page, limit, total, totalPages } }
        → FE: hiển thị scholarship cards
```

### Filters Logic

| Filter | DB Column | Type | Operator |
|--------|----------|------|----------|
| country | country | string | ILIKE %keyword% |
| degree | degree | string | = |
| field | field_of_study | string | ILIKE %keyword% |
| language | language | string | = |
| min_gpa | min_gpa | number | <= user's gpa |
| min_ielts | min_ielts | number | <= user's english_level score |
| deadline_from | deadline | date | >= |
| deadline_to | deadline | date | <= |
| amount_min | amount | number | >= |
| coverage | coverage | string | = |
| featured | is_featured | boolean | = |
| search | title, provider | string | ILIKE %keyword% |

### Pagination
- Default: page=1, limit=20
- Max limit: 50
- Response có `meta: { page, limit, total, totalPages }`

### Edge Cases
- Không có filter nào → trả về top 20 scholarships mới nhất (deadline gần nhất)
- Filter không match → trả về empty array + meta.total = 0
- Deadline đã qua hoặc hết hạn trong ngày (`deadline > NOW()`) → không hiển thị
- Limit vượt quá 50 → tự động clamp về 50 (MAX_LIMIT)
- Invalid scholarship ID (UUID không đúng format) → PostgreSQL error → 500
- Scholarship inactive hoặc hết hạn → `getById` trả 404

---

## 2. Profile Manager (P0 Feature #2)

**Trạng thái:** Chưa bắt đầu

### Mô tả
User quản lý profile cá nhân: GPA, trình độ tiếng Anh, quốc gia/ngành muốn đến, upload & quản lý documents (CV, SOP, bảng điểm, thư giới thiệu).

### User Flow

```
User → Profile Page
  → View/Edit profile info (PUT /api/profile)
  → Upload document (POST /api/documents/upload)
  → View uploaded documents
  → Delete document (DELETE /api/documents/:id)
```

### Document Types

| Type | Mô tả | Max Size | Allowed Types |
|------|-------|----------|--------------|
| cv | Curriculum Vitae | 10MB | .pdf, .doc, .docx |
| sop | Statement of Purpose | 10MB | .pdf, .doc, .docx |
| transcript | Bảng điểm | 10MB | .pdf |
| recommendation_letter | Thư giới thiệu | 10MB | .pdf |
| other | Khác | 10MB | .pdf, .doc, .docx, .png, .jpg |

### File Storage
- Supabase Storage bucket: `documents`
- Path format: `/{user_id}/{type}/{filename}`
- URL expires: never (public bucket with signed URLs for sensitive)

### Edge Cases
- Upload trùng type → cho phép (user có thể có nhiều CV)
- File quá lớn → trả 400 với message rõ
- Type không hợp lệ → trả 400 với danh sách types hợp lệ
- Upload fail → rollback Supabase storage upload, trả 500

---

## 3. Application Tracker (P0 Feature #3)

**Trạng thái:** ✅ VÙNG 2 Hoàn thành (17/4/2026) — Controller → Service → Repository → DB

### Kiến trúc VÙNG 2 (4 tầng)

```
Controller  (application-v2.controller.js) — Facade: nhận req, gọi service, trả res JSON
    ↓
Service     (application-v2.service.js)    — Business logic, validate input, format response
    ↓
Repository  (application.repository.js)    — Raw SQL duy nhất, parameterized queries
    ↓
DB          (PostgreSQL / applications table)
```

### File Structure (VÙNG 2)
```
src/
├── repositories/
│   ├── base.repository.js           ← class cha dùng chung
│   └── application.repository.js   ← Toàn bộ SQL cho applications
├── services/
│   └── application-v2.service.js   ← Business logic, validate status
├── controllers/
│   └── application-v2.controller.js ← Facade, ERROR_MAP, HTTP handling
├── routes/
│   └── application-v2.routes.js    ← Route definitions
└── container.js                    ← Wiring: db → Repo → Service
```

### API Endpoints (VÙNG 2)
| Method | Path | Mô tả |
|--------|------|--------|
| GET | /api/v2/applications | Danh sách đơn (phân trang, lọc status) |
| POST | /api/v2/applications | Tạo đơn mới (status='draft') |
| GET | /api/v2/applications/:id | Chi tiết 1 đơn |
| PATCH | /api/v2/applications/:id | Cập nhật đơn |
| DELETE | /api/v2/applications/:id | Xóa đơn |

### Application Status Flow

```
draft → submitted → under_review → interview → accepted
                   ↘→ rejected
                   ↘→ withdrawn
```

### Checklist Model
```json
[
  { "item": "CV", "done": false, "document_id": "uuid-or-null" },
  { "item": "SOP", "done": false, "document_id": "uuid-or-null" },
  { "item": "Bảng điểm", "done": false, "document_id": "uuid-or-null" },
  { "item": "Thư giới thiệu", "done": false, "document_id": "uuid-or-null" },
  { "item": "IELTS Certificate", "done": false, "document_id": "uuid-or-null" },
  { "item": "Hộ chiếu", "done": false, "document_id": "uuid-or-null" }
]
```

### Data Flow (VÙNG 2)

```
FE: ApplicationListPage
  → GET /api/v2/applications?page=1&limit=20&status=draft
    → Controller.getAll(req, res)
      → Service.getAll(userId, filters)
        → Repository.findAllByUser(userId, { page, limit, status })
          → Raw SQL: JOIN applications + scholarships + pagination
        → Service format response
      → Controller trả JSON { success: true, data: [...], meta: { page, limit, total } }
    → FE hiển thị danh sách

FE: ApplicationDetailPage
  → PATCH /api/v2/applications/:id { status: "submitted", checklist: [...] }
    → Controller.update(req, res)
      → Service.update(userId, applicationId, updates)
        → Repository.findByIdAndUser() — lấy đơn hiện tại
        → Service validate status enum + status transition
        → Repository.updateByIdAndUser() — cập nhật DB
        → Service auto-set applied_at khi draft → submitted
        → Service format response
      → Controller trả JSON
    → FE show success toast

FE: Xóa đơn
  → DELETE /api/v2/applications/:id
    → Controller.remove(req, res)
      → Service.delete(userId, applicationId)
        → Repository.findByIdAndUser() — lấy đơn hiện tại
        → Service chặn nếu status ∈ ['submitted', 'under_review']
        → Repository.deleteByIdAndUser() — xóa với điều kiện user_id
      → Controller trả JSON
    → FE show success toast
```

### Error Codes (VÙNG 2)
| Error Code | HTTP | Nguồn | Mô tả |
|------------|------|--------|--------|
| SCHOLARSHIP_NOT_FOUND | 404 | Service | Học bổng không tồn tại (trước khi tạo đơn) |
| APPLICATION_ALREADY_EXISTS | 409 | Repository (PostgreSQL err.code=23505) | UNIQUE(user_id, scholarship_id) bị vi phạm |
| NOT_FOUND | 404 | Service/Repository | Đơn không tồn tại hoặc không thuộc user |
| INVALID_STATUS | 400 | Service | Status truyền không nằm trong enum ['draft','submitted','under_review','interview','accepted','rejected','withdrawn'] |
| INVALID_STATUS_TRANSITION | 400 | Service | Chuyển trạng thái không hợp lệ (VD: accepted → draft) |
| CANNOT_DELETE_SUBMITTED | 400 | Service | Cố xóa đơn đã submitted/under_review |

### Edge Cases
| Scenario | Handling |
|----------|----------|
| User đã ứng tuyển scholarship | PostgreSQL UNIQUE constraint → err.code=23505 → Repository ném 'APPLICATION_ALREADY_EXISTS' → HTTP 409 |
| Xóa application khi status = "submitted" | Service chặn → HTTP 400 với message "Không thể xóa đơn đã nộp" |
| Update status không hợp lệ (VD: accepted → draft) | Service kiểm tra VALID_TRANSITIONS → ném 'INVALID_STATUS_TRANSITION' → HTTP 400 |
| Update status không nằm trong enum | Service kiểm tra VALID_STATUSES → ném 'INVALID_STATUS' → HTTP 400 |
| Update status = submitted từ draft | Service tự động set applied_at = now() |
| Xóa application của user khác | Repository luôn thêm AND user_id = $2 → trả 0 row affected → Service ném 'NOT_FOUND' |
| scholarship_id không tồn tại khi tạo đơn | Service gọi scholarshipExists() → ném 'SCHOLARSHIP_NOT_FOUND' → HTTP 404 |

---

## 4. AI Recommender (P1 Feature #4)

**Trạng thái:** Chưa bắt đầu

### Mô tả
Gợi ý học bổng phù hợp với profile user (GPA, ngành, quốc gia, trình độ tiếng Anh).

### Algorithm (Rule-based Fallback)

```
score = 0
if scholarship.min_gpa <= user.gpa: score += 30
if scholarship.degree == user.target_degree: score += 20
if scholarship.country == user.target_country: score += 20
if scholarship.field_of_study == user.target_major: score += 15
if scholarship.language match user's english: score += 10
if scholarship.deadline within 90 days: score += 5
return score / 100
```

### AI Enhancement (OpenAI/Gemini)

```
1. FE gọi POST /api/recommend
2. BE lấy user profile + documents
3. BE gọi OpenAI/Gemini API với prompt chứa user profile + scholarships list
4. AI trả về ranked recommendations + reasoning
5. BE cache kết quả 24h (Redis or DB)
```

### Prompt Template (AI)
```
Based on the following student profile, recommend the most suitable scholarships:
- GPA: {gpa}
- Target country: {country}
- Target major: {major}
- English level: {english_level}
- Target degree: {degree}

Scholarships list:
{scholarships_json}

Return top {top_n} recommendations with match score (0-1) and reasons.
```

### Edge Cases
- User chưa có profile → trả 401 với message "Vui lòng cập nhật profile trước"
- API key không configured → fallback về rule-based
- AI response timeout → fallback về rule-based
- No scholarships match → return empty array

---

## 5. Scholarship Data Seed (Scholar Scraping)

**Trạng thái:** ✅ Hoàn thành (31/3/2026)

### Mô tả
Script tự động cào học bổng từ trang **scholars4dev.com** và seed vào Supabase/PostgreSQL, phục vụ target 500+ học bổng trước tuần 6 (6/5/2026).

### File
`backend/scripts/seed-scholarships.js`

### Các mode chạy

```bash
npm run seed        # Scrape từ web + seed vào DB (mặc định)
npm run seed:mock   # Chỉ chạy mock data (50 học bổng hardcoded)
npm run scrape      # Chỉ scrape, không insert DB
```

### Data Flow

```
scholars4dev.com (3 category pages)
  → scrapeScholarshipListPage(url)
    → Tìm scholarship links (regex: /\/\d+\//)
    → Với mỗi link: axios.get(detail page)
      → cheerio parse: provider, degree, deadline, country, application_url, image_url
      → parseDeadline() → PostgreSQL timestamp
      → mapDegree() → enum: Bachelor | Master | PhD | Any
      → is_active = deadline > now
      → sleep(1200ms) giữa mỗi detail page (rate limit)
    → sleep(2000ms) giữa mỗi category page
  → Deduplicate by title
  → insertViaSupabase() / insertViaPg() → scholarships table
```

### Quy chuẩn dữ liệu

| Trường | Quy tắc |
|--------|---------|
| `degree` | Map text → enum: Bachelor, Master, PhD, Any. Default: Master |
| `deadline` | Parse "30 April 2026", "April 2026" → timestamp. "varies"/"open" → fallback ngày cuối tháng + 4 tháng |
| `is_active` | `deadline > now()` → true, ngược lại false |
| `source` | `'scholars4dev'` (scraped) hoặc `'own'` (mock data) |
| `currency` | Mặc định `USD` |
| Trường nullable | city, university, field_of_study, min_ielts, amount, coverage... |

### Dependencies
```json
"axios": "^1.6.7",
"cheerio": "^1.0.0-rc.12"
```

### Edge Cases

| Trường hợp | Xử lý |
|-------------|--------|
| Deadline "varies"/"open" | Fallback: ngày cuối tháng hiện tại + 4 tháng |
| Deadline đã qua | Tự động +1 năm |
| Degree text không parse được | Default: `Master` |
| Trùng scholarship (cùng title) | Deduplicate bằng Set trước khi insert |
| Insert conflict (cùng scholarship đã tồn tại) | `ON CONFLICT DO NOTHING` |
| Rate limit bị chặn | 1.2s sleep giữa mỗi request |

---

## General Edge Cases

| Scenario | Handling |
|----------|----------|
| User chưa login | Return 401, FE redirect to /login |
| Expired JWT | Return 401, FE clear token, redirect to /login |
| Invalid ObjectId (uuid) | Return 404 |
| Rate limit exceeded | Return 429, FE show "Thử lại sau X phút" |
| Supabase connection fail | Return 500, log error |
| Empty search results | Return 200 với empty array + helpful message |

---

## Performance Targets

| Action | Target |
|--------|--------|
| Scholarship list (no filter) | < 200ms |
| Scholarship search (with filters) | < 500ms |
| Profile load | < 100ms |
| Document upload | < 5s (depending on file size) |
| AI recommend | < 10s |
