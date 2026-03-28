# ScholarsGo — Backend API Server

Express.js API server cho ScholarsGo — nền tảng tìm kiếm học bổng và quản lý hồ sơ du học cho sinh viên Việt Nam.

## Quick Start

```bash
# 1. Copy và cấu hình .env
cp .env.example .env

# 2. Cài đặt dependencies
npm install

# 3. Chạy dev server
npm run dev

# API sẽ chạy tại http://localhost:5000
# Health check: http://localhost:5000/api/health
```

## Yêu cầu môi trường

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker Desktop (để chạy Supabase local)

## Cấu hình .env

Tạo file `.env` từ `.env.example`. Giá trị mặc định đã được cấu hình sẵn cho Supabase local Docker.

## Docker Local Development

```bash
# 1. Khởi động toàn bộ Supabase stack (PostgreSQL + pgAdmin4 + Auth + Storage)
docker-compose up -d

# 2. Kiểm tra container chạy healthy
docker ps

# 3. Mở pgAdmin4 xem database (giao diện web)
# → http://localhost:5050
#    Email:    admin@scholarsgo.com
#    Password: scholarsgo_admin

#    Khi thêm server mới trong pgAdmin4:
#    - Host:     scholarsgo_postgres
#    - Port:     5432
#    - Database: postgres
#    - User:     postgres
#    - Password: scholarsgo_password

# 4. Hoặc xem trong Supabase Studio (local)
# → http://localhost:3000

# 5. Hoặc dùng terminal psql
docker exec -it scholarsgo_postgres psql -U postgres
# \dt  → xem tables
# \q   → thoát

# 6. Dừng stack
docker-compose down

# 7. Xóa data (reset database)
docker-compose down -v
docker-compose up -d
```

## Cấu trúc thư mục

```
src/
├── controllers/      # Business logic (gọi services)
│   ├── auth.controller.js
│   ├── scholarship.controller.js
│   ├── profile.controller.js
│   ├── document.controller.js
│   ├── application.controller.js
│   ├── saved.controller.js
│   └── recommend.controller.js
├── routes/           # Định nghĩa route (chỉ route, không logic)
│   ├── auth.routes.js
│   ├── scholarship.routes.js
│   ├── profile.routes.js
│   ├── document.routes.js
│   ├── application.routes.js
│   ├── saved.routes.js
│   └── recommend.routes.js
├── middlewares/       # Auth, validation, error handling, upload
│   ├── auth.js        # JWT authentication
│   ├── validate.js    # Zod schema validation
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   └── upload.js      # Multer file upload
├── services/         # Supabase queries, external APIs
│   ├── supabase.js
│   ├── auth.service.js
│   ├── scholarship.service.js
│   ├── profile.service.js
│   ├── document.service.js
│   ├── application.service.js
│   ├── saved.service.js
│   └── recommend.service.js
├── utils/
│   ├── responseHelper.js  # Helper trả về JSON chuẩn
│   ├── validators.js      # Zod schemas cho tất cả endpoints
│   └── helpers.js        # Utility functions
├── app.js           # Express app (middleware setup)
└── server.js        # Entry point (listen PORT)
```

## Scripts

| Command | Mô tả |
|---------|-------|
| `npm run dev` | Chạy dev server với nodemon |
| `npm start` | Chạy production server |
| `npm run lint` | Chạy ESLint |
| `npm run lint:fix` | Auto-fix ESLint errors |

## API Endpoints

Tất cả endpoints được định nghĩa trong `docs/MEMORY-api.md`.

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/register` — Đăng ký user mới
- `POST /auth/login` — Đăng nhập
- `GET /auth/me` — Lấy thông tin user hiện tại
- `POST /auth/logout` — Đăng xuất
- `POST /auth/refresh` — Refresh JWT token

### Scholarships
- `GET /scholarships` — Danh sách học bổng (filter, pagination)
- `GET /scholarships/featured` — Học bổng nổi bật
- `GET /scholarships/countries` — Danh sách quốc gia
- `GET /scholarships/:id` — Chi tiết học bổng

### Profile
- `GET /profile` — Lấy profile user
- `PUT /profile` — Cập nhật profile

### Documents
- `GET /documents` — Danh sách documents
- `POST /documents/upload` — Upload document (multipart)
- `DELETE /documents/:id` — Xóa document

### Applications
- `GET /applications` — Danh sách applications (filter, pagination)
- `POST /applications` — Tạo application mới
- `GET /applications/:id` — Chi tiết application
- `PATCH /applications/:id` — Cập nhật application
- `DELETE /applications/:id` — Xóa application

### Saved
- `GET /saved` — Danh sách học bổng đã lưu
- `POST /saved/:scholarshipId` — Lưu học bổng
- `DELETE /saved/:scholarshipId` — Bỏ lưu học bổng

### AI Recommender (P1)
- `POST /recommend` — Gợi ý học bổng (AI hoặc rule-based)

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

## Lỗi thường gặp

### 1. `SUPABASE_URL is required`
Chưa cấu hình `.env`. Copy `.env.example` → `.env` và điền Supabase credentials.

### 2. Docker container không start được
- Kiểm tra Docker Desktop đang chạy
- Kiểm tra port 5432, 3000, 5050 không bị chiếm

### 3. `Connection refused` khi gọi API
Supabase local chưa healthy. Đợi 20-30s sau `docker-compose up -d` rồi thử lại.

### 4. `CORS error`
Chưa cấu hình `FRONTEND_URL` trong `.env`. Hoặc origin không khớp với `FRONTEND_URL`.

### 5. pgAdmin4 không kết nối được DB
- Host phải là `scholarsgo_postgres` (container name), không phải `localhost`
