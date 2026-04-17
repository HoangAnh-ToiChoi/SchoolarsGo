# PROMPT DÙNG TRONG CURSOR KHI THÊM FEATURE/API MỚI
# ============================================================
# Cách dùng: Copy toàn bộ block bên dưới, paste vào Cursor chat,
# thay [TÊN_MODULE] bằng tên thật (vd: application, profile, saved)
# ============================================================

---

## 🆕 Tạo mới module: [TÊN_MODULE]

Tôi cần thêm feature **[MÔ TẢ NGẮN]** vào hệ thống.

### Kiến trúc bắt buộc (KHÔNG được thay đổi):
```
Controller → Service → Repository → DB
```

### Quy tắc cứng — PHẢI tuân theo:

**1. KHÔNG đụng vào code cũ:**
- Các file trong `/controllers`, `/services`, `/routes` đang hoạt động tốt
- Chỉ được TẠO MỚI file, KHÔNG sửa file cũ trừ khi tôi yêu cầu rõ ràng
- Nếu cần kết nối với module cũ → import vào, không sửa file đó

**2. Cấu trúc file bắt buộc cho code mới:**
```
/backend/src/
  /repositories/
    base.repository.js          ← tạo nếu chưa có
    [ten_module].repository.js  ← tạo mới
  /services/
    [ten_module].service.js     ← tạo mới (class-based, KHÔNG có SQL)
  /controllers/
    [ten_module].controller.js  ← tạo mới (class-based, chỉ HTTP handling)
  /routes/
    [ten_module].routes.js      ← tạo mới
  container.js                  ← cập nhật để wire dependency mới vào
```

**3. Quy tắc từng tầng:**

Repository (`[ten_module].repository.js`):
- extends BaseRepository
- Toàn bộ SQL nằm ở đây — KHÔNG nơi nào khác được viết SQL
- Nhận `db` qua constructor (inject), KHÔNG tự require db

Service (`[ten_module].service.js`):
- Class với constructor nhận repository qua parameter
- KHÔNG được import db, KHÔNG được viết SQL
- Chỉ: validate input, business logic, gọi repository, format response
- Ném Error với mã cụ thể (vd: `throw new Error('RESOURCE_NOT_FOUND')`)

Controller (`[ten_module].controller.js`):
- Class, mỗi method là 1 route handler
- Import từ `../container` — KHÔNG import service trực tiếp
- Chỉ: nhận req → gọi service → trả res
- Map error code sang HTTP status (dùng ERROR_MAP object)
- `module.exports = new [TenModule]Controller()`

**4. container.js — chỉ thêm vào, không xóa:**
```js
// Thêm vào cuối, KHÔNG sửa các dòng cũ
const [TenModule]Repository = require('./repositories/[ten_module].repository');
const [TenModule]Service    = require('./services/[ten_module].service');
const [ten_module]Repo      = new [TenModule]Repository(db);
const [ten_module]Service   = new [TenModule]Service([ten_module]Repo);
module.exports = { ...module.exports, [ten_module]Service };
```

**5. Naming convention:**
- File: `kebab-case` → `saved-scholarship.repository.js`
- Class: `PascalCase` → `class SavedScholarshipRepository`
- Instance: `camelCase` → `savedScholarshipService`
- Error codes: `UPPER_SNAKE` → `'SCHOLARSHIP_ALREADY_SAVED'`

**6. Sau khi xong:**
- Cập nhật `docs/MEMORY-api.md` với endpoints mới
- Cập nhật `docs/MEMORY-features.md` với data flow của feature
- Cập nhật `docs/MEMORY.md` status

### Bắt đầu với kế hoạch:
Phân tích requirement, liệt kê file cần tạo, DB tables bị ảnh hưởng, endpoints cần có.
Kết thúc bằng: "✅ Bạn có duyệt plan này để mình bắt đầu không?"
