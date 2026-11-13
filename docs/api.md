> **Lưu ý:** tài liệu này viết khoảng 04–05/2026 (trước đây là `docs/memory*.md`) và có thể lệch với code hiện tại. Khi khác nhau, code là đúng.

# ============================================================
# SCHOLARSGO — API CONTRACTS
# ============================================================
# Last Updated: 13/11/2026

---

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000/api` |
| Staging | `https://api-staging.scholarsgo.com/api` |
| Production | `https://api.scholarsgo.com/api` |

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

### Error
```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "code": "ACCESS_TOKEN_EXPIRED",
  "errors": [{ "field": "email", "message": "Email không hợp lệ" }]
}
```

---

## Auth

Authentication uses an HttpOnly access cookie (15 minutes, path `/api`) and refresh cookie (7 days, path `/api/auth`). Refresh tokens rotate on use; only their SHA-256 hashes are stored.

### POST /api/auth/register and POST /api/auth/login
Create an account or start a session. Both return `{ user }` with only `id`, `full_name`, `avatar_url`, and `role`; credentials are set as cookies. Register also accepts `full_name`.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "Nguyen Van A"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "full_name": "...", "avatar_url": null, "role": "user" }
  }
}
```

---

### GET /api/auth/me
Get current user profile (auth required).

**Headers:** Access cookie, or `Authorization: Bearer <accessToken>` for Swagger.

**Response 200:**
```json
{
  "success": true,
  "data": { "id": "uuid", "full_name": "...", "avatar_url": null, "role": "user" }
}
```

### POST /api/auth/refresh
Does not require the access token. Rotates the refresh cookie and returns the same `{ user }` fields as login.

### POST /api/auth/logout
Revokes the current refresh session when available and clears both new cookies and the legacy `token` cookie.

### GET /api/auth/account
Returns private account fields for the signed-in user: `email`, `phone`, and `date_of_birth`.

### GET /api/auth/sessions and DELETE /api/auth/sessions/:id
List up to three active devices, including `is_current`, or revoke a session owned by the signed-in user. A session belonging to another user returns 404.

---

## Scholarships

### GET /api/scholarships
List scholarships with filters.

**Query params:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| page | int | 1 | Trang |
| limit | int | 20 | Số item/trang (max 50) |
| country | string | — | Lọc theo quốc gia |
| scope | string | — | `domestic` (Việt Nam) hoặc `international` (du học) |
| degree | string | — | Bachelor, Master, PhD, Any |
| field | string | — | Ngành học |
| language | string | — | Ngôn ngữ giảng dạy |
| min_gpa | number | — | GPA tối thiểu |
| min_ielts | number | — | IELTS tối thiểu |
| deadline_from | date | — | Hạn nộp từ ngày |
| deadline_to | date | — | Hạn nộp đến ngày |
| amount_min | number | — | Học bổng tối thiểu (USD) |
| coverage | string | — | Full, Partial, Tuition, Stipend |
| featured | boolean | — | Chỉ học bổng nổi bật |
| search | string | — | Tìm kiếm theo title/provider |

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "title": "...", "country": "...", "deadline": "...", "amount": 10000 }
  ],
  "meta": { "page": 1, "limit": 20, "total": 500, "totalPages": 25 }
}
```

---

### GET /api/scholarships/:id
Get scholarship detail.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "provider": "...",
    "country": "...",
    "degree": "...",
    "amount": 10000,
    "deadline": "2026-06-01T00:00:00Z",
    "eligibility": "...",
    "requirements": "...",
    "benefits": "...",
    "application_url": "https://...",
    "is_saved": false
  }
}
```

---

## Profile

### GET /api/profile
Get current user's profile (auth required).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "bio": "...",
    "gpa": 3.5,
    "english_level": "IELTS 7.0",
    "target_country": "UK",
    "target_major": "Computer Science",
    "documents": [...]
  }
}
```

---

### PUT /api/profile
Update profile (auth required).

**Body:** (partial update)
```json
{
  "gpa": 3.6,
  "target_country": "Australia",
  "english_level": "IELTS 7.5"
}
```

---

## Documents

### GET /api/documents
List user's documents (auth required).

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "type": "cv", "file_name": "my_cv.pdf", "file_url": "...", "created_at": "..." }
  ]
}
```

---

### POST /api/documents/upload
Upload a document (auth required).

**Body:** `multipart/form-data`
| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| file | File | Yes | File cần upload |
| type | string | Yes | cv, sop, transcript, recommendation_letter, other |

**Response 201:**
```json
{
  "success": true,
  "data": { "id": "uuid", "type": "cv", "file_name": "...", "file_url": "..." }
}
```

---

### DELETE /api/documents/:id
Delete a document (auth required).

---

## Applications

### GET /api/applications
List user's applications (auth required).

**Query params:** `page`, `limit`, `status`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "scholarship_id": "uuid",
      "scholarship": { "title": "...", "country": "..." },
      "status": "submitted",
      "applied_at": "2026-04-01T00:00:00Z",
      "checklist": [...]
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

---

### POST /api/applications
Create new application (auth required).

**Body:**
```json
{
  "scholarship_id": "uuid",
  "checklist": [{ "item": "CV", "done": false }, { "item": "SOP", "done": false }],
  "notes": "Ghi chú..."
}
```

---

### PATCH /api/applications/:id
Update application (auth required).

**Body:** (partial)
```json
{
  "status": "submitted",
  "checklist": [{ "item": "CV", "done": true }],
  "notes": "..."
}
```

---

### DELETE /api/applications/:id
Delete application (auth required).

---

## Applications (VÙNG 2 — Controller → Service → Repository → DB)

Kiến trúc 4 tầng: `Controller → Service → Repository → DB`

Base URL: `/api/v2/applications` (chạy song song với VÙNG 1 tại `/api/applications`)

### GET /api/v2/applications
List user's applications (auth required).

**Query params:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| page | int | 1 | Trang |
| limit | int | 20 | Số item/trang (max 50) |
| status | string | — | draft, submitted, under_review, interview, accepted, rejected, withdrawn |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "submitted",
      "applied_at": "2026-04-01T00:00:00Z",
      "notes": "...",
      "checklist": [...],
      "documents_used": [],
      "result": null,
      "created_at": "...",
      "updated_at": "...",
      "scholarship": {
        "id": "uuid",
        "title": "...",
        "country": "UK",
        "deadline": "2026-06-01T00:00:00Z",
        "amount": 10000,
        "image_url": "..."
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

---

### POST /api/v2/applications
Create new application (auth required). Mặc định status = 'draft'.

**Body:**
```json
{
  "scholarship_id": "uuid",
  "checklist": [{ "item": "CV", "done": false }],
  "notes": "Ghi chú..."
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": "uuid", "status": "draft", "scholarship": {...} },
  "message": "Đơn ứng tuyển đã được tạo thành công."
}
```

**Errors:**
| Code | HTTP | Mô tả |
|------|------|--------|
| SCHOLARSHIP_NOT_FOUND | 404 | Học bổng không tồn tại |
| APPLICATION_ALREADY_EXISTS | 409 | Đã ứng tuyển học bổng này rồi |

---

### GET /api/v2/applications/:id
Get application detail (auth required, user must own the application).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "draft",
    "notes": "...",
    "checklist": [...],
    "scholarship": { "id": "uuid", "title": "...", "country": "...", "deadline": "...", "amount": 10000, "image_url": "..." }
  }
}
```

---

### PATCH /api/v2/applications/:id
Update application (auth required).

**Body:** (partial)
```json
{
  "status": "submitted",
  "checklist": [{ "item": "CV", "done": true }],
  "notes": "..."
}
```

**Errors:**
| Code | HTTP | Mô tả |
|------|------|--------|
| NOT_FOUND | 404 | Đơn không tồn tại hoặc không thuộc user |
| INVALID_STATUS | 400 | Status truyền không nằm trong enum cho phép |
| INVALID_STATUS_TRANSITION | 400 | Chuyển trạng thái không hợp lệ (VD: accepted → draft) |

**Status Flow hợp lệ:**
```
draft → submitted | withdrawn
submitted → under_review | rejected | withdrawn
under_review → interview | rejected | withdrawn
interview → accepted | rejected | withdrawn
accepted → (terminal)
rejected → (terminal)
withdrawn → (terminal)
```

---

### DELETE /api/v2/applications/:id
Delete application (auth required, must include user_id in WHERE clause).

**Response 200:**
```json
{
  "success": true,
  "data": null,
  "message": "Đơn ứng tuyển đã được xóa thành công."
}
```

**Errors:**
| Code | HTTP | Mô tả |
|------|------|--------|
| NOT_FOUND | 404 | Đơn không tồn tại hoặc không thuộc user |
| CANNOT_DELETE_SUBMITTED | 400 | Không thể xóa đơn đã nộp hoặc đang review |

---

## Saved Scholarships

### GET /api/saved
List saved scholarships (auth required).

**Response 200:**
```json
{
  "success": true,
  "data": [{ "id": "uuid", "scholarship": {...}, "note": "...", "created_at": "..." }]
}
```

---

### POST /api/saved/:scholarshipId
Save a scholarship (auth required).

**Body:** `{ "note": "Ưu tiên cao" }`

---

### DELETE /api/saved/:scholarshipId
Unsave a scholarship (auth required).

---

## Notifications (chuông trên header)

Server tự tạo **nhắc hạn nộp** ở các mốc 14 / 7 / 1 ngày cho học bổng đã lưu và đơn còn nháp: job chạy 7:00 mỗi sáng (GMT+7), và chạy lại cho riêng người dùng mỗi lần gọi `GET` (không tạo trùng). Cần đăng nhập.

### GET /api/notifications

Query: `limit` (1–50, mặc định 30). Mỗi học bổng chỉ trả thông báo mới nhất; bỏ nhắc hạn đã quá hạn hoặc của đơn đã nộp.

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "deadline",
      "milestone": 7,
      "days_left": 5,
      "application_id": "uuid | null",
      "read_at": null,
      "created_at": "2026-11-10T00:00:00Z",
      "scholarship": { "id": "uuid", "slug": "chevening-scholarship", "title": "Chevening Scholarship", "provider": "…", "deadline": "2026-11-15T00:00:00" }
    }
  ],
  "meta": { "unread": 1 }
}
```

`application_id` có giá trị → nhắc theo đơn nháp (FE mở `/applications/:id`); `null` → nhắc học bổng đã lưu (FE mở trang học bổng).

### PATCH /api/notifications/:id/read

Đánh dấu một thông báo đã đọc. 404 nếu thông báo không thuộc người dùng.

### PATCH /api/notifications/readAll

Đánh dấu tất cả đã đọc. Trả `{ "updated": <số thông báo> }`.

---

## AI Recommender (P1)

### POST /api/recommend
Get scholarship recommendations based on user profile (auth required).

**Body:**
```json
{
  "top_n": 10
}
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "scholarship": {...}, "match_score": 0.92, "reasons": ["GPA phù hợp", "Ngành Computer Science"] }
  ]
}
```

---

## HTTP Status Codes

| Code | Mô tả |
|------|-------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limit) |
| 500 | Server Error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /api/auth/login | 5 req / phút / IP |
| POST /api/auth/register | 3 req / phút / IP |
| All other endpoints | 100 req / phút / user |

---

## Endpoint Status

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| POST | /api/auth/register | ✅ Implemented | Cookie access 15 phút + refresh 7 ngày; tối đa 3 thiết bị |
| POST | /api/auth/login | ✅ Implemented | Chặn tài khoản bị khóa; trả dữ liệu user tối thiểu |
| GET | /api/auth/me | ✅ Implemented | Trả id, tên, ảnh và role |
| POST | /api/auth/logout | ✅ Implemented | Thu hồi phiên refresh và xóa cookie |
| POST | /api/auth/refresh | ✅ Implemented | Xoay refresh token, không cần access auth |
| GET | /api/auth/account | ✅ Implemented | Trả email, số điện thoại, ngày sinh |
| GET | /api/auth/sessions | ✅ Implemented | Tối đa 3 thiết bị đang hoạt động |
| DELETE | /api/auth/sessions/:id | ✅ Implemented | Chỉ thu hồi phiên của user hiện tại |
| GET | /api/scholarships | ✅ Implemented | Filters: country, degree, min_gpa, search, language, coverage, featured... Pagination. Raw SQL. |
| GET | /api/scholarships/:id | ✅ Implemented | Detail. is_active + deadline > NOW(). Raw SQL. |
| GET | /api/scholarships/featured | ✅ Implemented | Top 6 featured scholarships |
| GET | /api/scholarships/countries | ✅ Implemented | Distinct country list |
| GET | /api/profile | ✅ Implemented | UPSERT: INSERT ON CONFLICT DO UPDATE. Raw SQL, < 100ms. |
| PUT | /api/profile | ✅ Implemented | Validation GPA 0-4.0, degree Bachelor/Master/PhD. Zod validation. |
| GET | /api/documents | ✅ Implemented | Raw SQL: SELECT * FROM documents WHERE user_id = $1 |
| POST | /api/documents/upload | ✅ Implemented | Supabase Storage + memoryStorage. Rollback nếu DB insert thất bại. Validate MIME/extension theo type. |
| DELETE | /api/documents/:id | ✅ Implemented | 2-step delete: Storage → DB. Always AND user_id = $2. |
| GET | /api/applications | Chưa implement | — |
| POST | /api/applications | Chưa implement | — |
| PATCH | /api/applications/:id | Chưa implement | — |
| DELETE | /api/applications/:id | Chưa implement | — |
| GET | /api/v2/applications | ✅ Implemented (17/4/2026) | VÙNG 2: Controller → Service → Repository → DB. Pagination, filter by status. |
| POST | /api/v2/applications | ✅ Implemented (17/4/2026) | VÙNG 2: Tạo đơn mới (status='draft'). Bắt lỗi UNIQUE constraint ở Repository. |
| PATCH | /api/v2/applications/:id | ✅ Implemented (17/4/2026) | VÙNG 2: Validate status enum + status transition. Auto-set applied_at khi draft→submitted. |
| DELETE | /api/v2/applications/:id | ✅ Implemented (17/4/2026) | VÙNG 2: Chặn xóa đơn đã submitted/under_review. |
| GET | /api/notifications | ✅ Implemented (10/11/2026) | Nhắc hạn 14/7/1 ngày + meta.unread |
| PATCH | /api/notifications/:id/read | ✅ Implemented (10/11/2026) | 404 nếu không phải của người dùng |
| PATCH | /api/notifications/readAll | ✅ Implemented (10/11/2026) | — |
| GET | /api/saved | Chưa implement | — |
| POST | /api/saved/:scholarshipId | Chưa implement | — |
| DELETE | /api/saved/:scholarshipId | Chưa implement | — |
| POST | /api/recommend | Chưa implement | — |
