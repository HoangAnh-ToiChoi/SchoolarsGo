# ============================================================
# SCHOLARSGO — DATABASE SCHEMA
# ============================================================
# Last Updated: 4/4/2026

---

## Tổng quan

| Database | Provider | Connection |
|----------|----------|------------|
| PostgreSQL | Supabase | Raw pg Pool (`src/utils/db.js`) | Raw SQL — không Supabase SDK cho API |

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
| created_at | timestamp | DEFAULT now() | Thời điểm tạo |
| updated_at | timestamp | DEFAULT now() | Thời điểm cập nhật |

**Indexes:** `CREATE INDEX idx_users_email ON users(email);`

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
| file_url | text | NOT NULL | URL file trên Supabase Storage |
| file_size | integer | NOT NULL | Kích thước (bytes) |
| mime_type | varchar(100) | NOT NULL | MIME type |
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

## RLS (Row Level Security)

Mặc định: Tất cả tables có RLS enabled, chỉ owner được truy cập dữ liệu của mình.
- `users` — chỉ user tự đọc/update profile mình
- `profiles` — chỉ user tự đọc/update
- `documents` — chỉ user tự đọc/update
- `applications` — chỉ user tự đọc/update
- `saved_scholarships` — chỉ user tự đọc/update
- `scholarships` — public read (anonymous)

---

## Seeding Plan

- Target: 500+ scholarships trước tuần 6 (6/5/2026)
- Nguồn seed: scholarships4dev.com RSS, web scraping, manual entry
- Script: `backend/scripts/seed-scholarships.js`
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

## Local Docker Setup

Chạy Supabase local trong Docker để development:

```bash
# 1. Khởi động toàn bộ stack
docker-compose up -d

# 2. Kiểm tra container đã healthy chưa
docker ps

# 3. Xem database (pgAdmin4 — giao diện web)
# → http://localhost:5050
#    Email:    admin@scholarsgo.com
#    Password:  scholarsgo_admin

# 4. Xem database (Supabase Studio)
# → http://localhost:3000

# 5. Xem database (terminal psql)
docker exec -it scholarsgo_postgres psql -U postgres
```

### Ports

| Port | Service |
|------|---------|
| 5432 | PostgreSQL |
| 3000 | Supabase Studio |
| 5050 | pgAdmin4 |
| 8000 | Kong API Gateway |
| 8080 | PostgreSQL Meta |
| 9999 | GoTrue Auth |
| 5000 | Storage API |

### Credentials

| Key | Value |
|-----|-------|
| DB Host | localhost:5432 |
| DB User | postgres |
| DB Password | scholarsgo_password |
| DB Name | postgres |
| pgAdmin Email | admin@scholarsgo.com |
| pgAdmin Password | scholarsgo_admin |
