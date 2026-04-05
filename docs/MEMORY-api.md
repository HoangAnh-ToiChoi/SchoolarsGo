# ============================================================
# SCHOLARSGO — API CONTRACTS
# ============================================================
# Last Updated: 4/4/2026

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
  "code": 400,
  "errors": [{ "field": "email", "message": "Email không hợp lệ" }]
}
```

---

## Auth

### POST /api/auth/register
Register new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "Nguyen Van A"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "full_name": "..." },
    "token": "jwt_token"
  }
}
```

---

### POST /api/auth/login
Login with email/password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "full_name": "..." },
    "token": "jwt_token"
  }
}
```

---

### GET /api/auth/me
Get current user profile (auth required).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "data": { "id": "uuid", "email": "...", "full_name": "..." }
}
```

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
| POST | /api/auth/register | ✅ Implemented | Raw SQL + bcryptjs + jwt. Rate limit: 3 req/phút/IP |
| POST | /api/auth/login | ✅ Implemented | Raw SQL + bcryptjs + jwt. Rate limit: 5 req/phút/IP |
| GET | /api/auth/me | ✅ Implemented | Auth required |
| POST | /api/auth/logout | ✅ Implemented | Clear cookie |
| POST | /api/auth/refresh | ✅ Implemented | Auth required |
| GET | /api/scholarships | ✅ Implemented | Filters: country, degree, min_gpa, search, language, coverage, featured... Pagination. Raw SQL. |
| GET | /api/scholarships/:id | ✅ Implemented | Detail. is_active + deadline > NOW(). Raw SQL. |
| GET | /api/scholarships/featured | ✅ Implemented | Top 6 featured scholarships |
| GET | /api/scholarships/countries | ✅ Implemented | Distinct country list |
| GET | /api/profile | Chưa implement | — |
| PUT | /api/profile | Chưa implement | — |
| GET | /api/documents | Chưa implement | — |
| POST | /api/documents/upload | Chưa implement | — |
| DELETE | /api/documents/:id | Chưa implement | — |
| GET | /api/applications | Chưa implement | — |
| POST | /api/applications | Chưa implement | — |
| PATCH | /api/applications/:id | Chưa implement | — |
| DELETE | /api/applications/:id | Chưa implement | — |
| GET | /api/saved | Chưa implement | — |
| POST | /api/saved/:scholarshipId | Chưa implement | — |
| DELETE | /api/saved/:scholarshipId | Chưa implement | — |
| POST | /api/recommend | Chưa implement | — |
