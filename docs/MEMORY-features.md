# ============================================================
# SCHOLARSGO — FEATURES & BUSINESS LOGIC
# ============================================================
# Last Updated: 26/3/2026

---

## 1. Scholarship Search (P0 Feature #1)

**Trạng thái:** Chưa bắt đầu

### Mô tả
Cho phép user tìm kiếm và filter học bổng theo nhiều tiêu chí: quốc gia, bậc học, ngành, GPA, deadline, ngôn ngữ...

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
          → supabase.from('scholarships').select('*', { filters })...
          → return { success: true, data: [...], meta: {...} }
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
- Không có filter nào → trả về top 20 scholarships mới nhất
- Filter không match → trả về empty array
- Deadline đã qua → không hiển thị (is_active = true AND deadline > now)

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

**Trạng thái:** Chưa bắt đầu

### Mô tả
Track đơn ứng tuyển của user: status, checklist hồ sơ, deadline, notes.

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

### Notifications
- Deadline approaching (7 days before): show warning badge
- Deadline passed: show "Expired" badge, move to archive tab

### Data Flow

```
FE: ApplicationDetailPage
  → PATCH /api/applications/:id { status: "submitted", checklist: [...] }
    → BE validate → update DB → return updated application
    → FE show success toast
```

### Edge Cases
- User đã ứng tuyển scholarship → không cho tạo đơn mới (unique constraint)
- Xóa application khi status = "submitted" → warning confirm dialog
- Update status không hợp lệ (VD: accepted → draft) → trả 400

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
