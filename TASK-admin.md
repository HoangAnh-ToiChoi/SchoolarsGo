# TASK — Admin Module

## Tổng quan
Xây dựng backend cho Admin Dashboard: quản lý user, học bổng, thống kê hệ thống.
Kiến trúc: `Route → requireRole('admin') → Controller → Service → Repository → DB`

---

## Cấu trúc file cần tạo

```
/backend/src/
  /repositories/
    admin.repository.js         ← SQL thống kê, query user/scholarship
  /services/
    admin.service.js            ← business logic admin
  /controllers/
    admin.controller.js         ← HTTP handling
  /routes/
    admin.routes.js             ← mount authMiddleware + requireRole
  /middlewares/
    requireRole.js              ← middleware kiểm tra role
  container.js                  ← thêm admin module vào
```

---

## Bước 1 — requireRole Middleware

**File:** `middlewares/requireRole.js`

```js
const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    const err = new Error('Không có quyền truy cập');
    err.statusCode = 403;
    err.isOperational = true;
    return next(err);
  }
  next();
};
module.exports = requireRole;
```

**Dùng trong route:**
```js
router.use(authMiddleware, requireRole('admin'));
```

---

## Bước 2 — Dashboard Stats

### `GET /api/admin/stats`
Trả về tất cả số liệu tổng quan trong 1 lần gọi.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 120,
    "newUsersThisWeek": 14,
    "totalScholarships": 500,
    "activeScholarships": 342,
    "totalApplications": 89,
    "applicationsByStatus": {
      "saved": 40,
      "in_progress": 25,
      "submitted": 15,
      "accepted": 6,
      "rejected": 3
    }
  }
}
```

### `GET /api/admin/stats/chart`
Data cho biểu đồ FE.

**Response:**
```json
{
  "success": true,
  "data": {
    "userRegistrationsByWeek": [
      { "week": "2026-W14", "count": 12 },
      { "week": "2026-W15", "count": 18 }
    ],
    "applicationsByStatus": [
      { "status": "saved", "count": 40 },
      { "status": "submitted", "count": 15 }
    ]
  }
}
```

---

## Bước 3 — Quản lý User

### `GET /api/admin/users`
Danh sách user, có filter và search.

**Query params:**
```
?page=1&limit=20
&role=user|admin          ← filter theo role
&search=email@...         ← tìm theo email hoặc full_name
&status=active|inactive   ← filter theo trạng thái
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 120, "totalPages": 6 }
}
```

---

### `GET /api/admin/users/:id`
Chi tiết 1 user.

**Response:** Trả về toàn bộ thông tin user kèm `last_login_at`, `role`, `created_at`.

---

### `PATCH /api/admin/users/:id/role`
Thay đổi role của user.

**Request body:**
```json
{ "role": "admin" }
```

**Validation:**
- `role` chỉ nhận `"user"` hoặc `"admin"`
- Admin không được tự đổi role của chính mình

---

### `PATCH /api/admin/users/:id/status`
Kích hoạt hoặc vô hiệu hóa tài khoản.

**Request body:**
```json
{ "isActive": false }
```

**Business rule:** Admin không được tự vô hiệu hóa chính mình.

---

## Bước 4 — Quản lý Học bổng

### `POST /api/admin/scholarships`
Thêm học bổng mới.

**Request body:** Tất cả fields của bảng `scholarships` (title, provider, country, degree, amount, deadline...)

**Response 201:** Scholarship vừa tạo.

---

### `PATCH /api/admin/scholarships/:id`
Cập nhật thông tin học bổng.

**Request body:** Các fields cần cập nhật (partial update).

---

### `PATCH /api/admin/scholarships/:id/featured`
Bật/tắt trạng thái nổi bật.

**Request body:**
```json
{ "isFeatured": true }
```

---

### `DELETE /api/admin/scholarships/:id`
Xóa mềm — set `is_active = false`, không xóa khỏi DB.

**Response:** `{ "success": true, "message": "Đã xóa học bổng" }`

---

## Thứ tự làm

```
Ngày 1: requireRole.js + AdminRepository + Stats API (2 endpoints)
         → Ngáo có data để làm FE dashboard ngay

Ngày 2: Admin User management (4 endpoints)
         → GET list, GET detail, PATCH role, PATCH status

Ngày 3: Admin Scholarship management (4 endpoints)
         → POST, PATCH, PATCH featured, DELETE

Ngày 4: Test toàn bộ qua Postman + đăng ký container.js
```

---

## OOP checklist (theo backend-oop.mdc)

- [ ] `requireRole.js` — middleware thuần, không cần class
- [ ] `AdminRepository` — extends BaseRepository, SQL chỉ ở đây
- [ ] `AdminService` — class, inject repo qua constructor, không có SQL
- [ ] `AdminController` — class, arrow functions, import từ container
- [ ] `admin.routes.js` — mount `authMiddleware` + `requireRole('admin')` trước tất cả routes
- [ ] `container.js` — thêm admin module, không xóa dòng cũ
- [ ] Business rules admin không tự sửa chính mình — xử lý trong Service
- [ ] Test Postman: dùng token user thường → phải nhận 403
- [ ] Test Postman: dùng token admin → pass
- [ ] Ghi vào `docs/MEMORY-api.md` và `MEMORY-devlog.md`
