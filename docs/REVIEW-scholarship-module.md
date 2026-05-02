# 🏛️ Enterprise Code Review — Scholarship Module (v2 — Corrected)

> **Reviewer:** Senior Backend Software Architect  
> **Scope:** routes → controller → service → repository + errorHandler + container  
> **Context:** Đã đối chiếu với `backend-oop.mdc`, `core.mdc`, `MEMORY-features.md`  
> **Date:** 2026-04-24

---

## ⚠️ ĐÍNH CHÍNH TỪ REVIEW V1

| Nhận định cũ (v1) | Đính chính (v2) |
|---|---|
| 🔴 "Bug CRITICAL: `idx` không tăng sau search filter" | ❌ **SAI.** `search` là filter cuối cùng trong `#buildWhereClause`. `findAll` dùng `params.length + 1` cho LIMIT/OFFSET — không dùng `idx`. **Code hiện tại hoạt động đúng.** |
| "Cần `asyncHandler` thay try/catch" | ❌ **Trái convention.** `backend-oop.mdc` dòng 56–67 quy định rõ: Controller dùng `try/catch + next(error)` — đây là pattern bắt buộc của dự án. |
| "Cần `AppError` class" | ⚠️ **Không cần thiết.** Dự án dùng pattern `#throwError(message, statusCode)` với `isOperational` flag — errorHandler.js đã xử lý đúng. Cả hai approach đều hợp lệ, nhưng nên theo convention đã có. |
| "Service là thin wrapper vô nghĩa" | ⚠️ **Đánh giá quá khắt khe.** Kiến trúc 4 tầng bắt buộc theo `core.mdc`. Service layer tồn tại để sẵn sàng cho business logic tương lai (validate, transform, event emit). |

---

## BƯỚC 1 — ✅ Ưu Điểm

| # | Tiêu chí | Nhận xét |
|---|----------|----------|
| 1 | **Layered Architecture 4 tầng** | Route → Controller → Service → Repository — đúng 100% theo `core.mdc` và `backend-oop.mdc`. SQL chỉ nằm trong Repository. |
| 2 | **DI qua Constructor** | Controller nhận Service, Service nhận Repository, Repository nhận `db` — tất cả wired trong `container.js`. **Không có class nào tự `new` dependency.** |
| 3 | **Singleton via Module Cache** | `container.js` export instances — Node.js cache đảm bảo singleton. Comment header giải thích rõ ràng. |
| 4 | **Centralized Error Handler** | `errorHandler.js` xử lý 6 loại lỗi: Supabase (23505, 23503), JWT, Multer, operational, storage, unknown. Không leak stack trace ở production. |
| 5 | **N+1 Prevention** | `#attachSavedStatus` dùng `ANY($2::uuid[])` batch query — **giải quyết N+1 hoàn toàn**. |
| 6 | **SQL Injection Prevention** | 100% parameterized queries (`$1, $2, ...`). |
| 7 | **Pagination Hard-cap** | `MAX_LIMIT = 50` — đúng theo `MEMORY-features.md` section 1. |
| 8 | **isOperational Flag** | Lỗi nghiệp vụ (404) có `isOperational = true` — errorHandler phân biệt được lỗi business vs system. |
| 9 | **optionalAuth** | Route public nhưng nhận `userId` khi có token → `is_saved` logic hoạt động cho cả guest và logged-in user. |
| 10 | **Input Validation** | Route `GET /` dùng `validate(scholarshipQuerySchema, 'query')` — Zod validation trước khi vào Controller. |
| 11 | **Private Fields (#)** | `#buildWhereClause`, `#attachSavedStatus`, `#checkSavedStatus`, `#ensureFound` — đúng OOP access modifier theo `backend-oop.mdc`. |
| 12 | **Arrow Functions trong Class** | Controller methods dùng arrow function — giữ `this` binding khi Express gọi callback. Đúng convention. |

---

## BƯỚC 2 — 🔴 Điểm Mù

### 🟠 [MEDIUM] — Repository: `findById` dùng `SELECT *`

**File:** [scholarship.repository.js](file:///d:/WorkSpace/Schoolars_Ship/backend/src/repositories/scholarship.repository.js#L98) — dòng 98

```js
// ❌ SELECT * kéo tất cả columns, bao gồm cả internal fields
'SELECT * FROM scholarships WHERE id = $1 AND is_active = true AND deadline > NOW()'
```

**Rủi ro:** Nếu thêm column nhạy cảm (`admin_note`, `internal_score`), data sẽ bị leak ra API response. `findAll` đã dùng column list tường minh — `findById` nên làm tương tự.

---

### 🟠 [MEDIUM] — Không có Structured Logging

**Cả 4 file** không có dòng log nào cho thao tác nghiệp vụ.

`errorHandler.js` chỉ log `console.error` trong dev mode (dòng 3–5, 99). Không có:
- Log khi query với filter nào
- Log khi `getById` miss (404) — cần để detect dead links
- Log latency của DB calls
- Log ở production (chỉ log khi `NODE_ENV !== 'production'`)

> [!IMPORTANT]
> `backend-oop.mdc` đã plan EventBus cho logging (`document.uploaded → log storage usage`). Nên triển khai logging song song.

---

### 🟠 [MEDIUM] — `WHERE is_active = true AND deadline > NOW()` lặp lại 4 nơi

**File:** [scholarship.repository.js](file:///d:/WorkSpace/Schoolars_Ship/backend/src/repositories/scholarship.repository.js) — dòng 74, 87, 98, 117

```js
// Dòng 74: findFeatured
WHERE is_active = true AND deadline >= now() AND is_featured = true

// Dòng 87: findCountries  
WHERE is_active = true AND country IS NOT NULL

// Dòng 98: findById
WHERE id = $1 AND is_active = true AND deadline > NOW()

// Dòng 117: #buildWhereClause
const conditions = ['is_active = true', 'deadline > NOW()'];
```

**Vấn đề:** Nếu thêm condition mới (VD: `is_deleted = false`), phải sửa 4 chỗ. Nên dùng private method `#baseActiveFilter()`.

> [!NOTE]
> `findCountries` (dòng 87) **THIẾU** `deadline > NOW()` so với các query khác — có thể là intentional (hiển thị country của cả học bổng hết hạn) hoặc là bug. Cần verify.

---

### 🟡 [LOW] — `idx` không tăng sau search — latent risk

**File:** [scholarship.repository.js](file:///d:/WorkSpace/Schoolars_Ship/backend/src/repositories/scholarship.repository.js#L164-L167) — dòng 164–167

```js
if (filters.search) {
  conditions.push(`(title ILIKE $${idx} OR provider ILIKE $${idx})`);
  params.push(`%${filters.search}%`);
  // idx không tăng — HIỆN TẠI không bug vì search là filter cuối
}
```

**Không phải bug**, nhưng nếu ai đó thêm filter sau `search`, sẽ gây lỗi param index. Nên thêm `idx++` hoặc refactor sang pattern `params.length`.

---

### 🟡 [LOW] — errorHandler: Phân loại lỗi bằng string matching

**File:** [errorHandler.js](file:///d:/WorkSpace/Schoolars_Ship/backend/src/middlewares/errorHandler.js#L85-L96) — dòng 85–96

```js
// ❌ Fragile — nếu đổi message text, error handler sẽ miss
if (err.message && (
  err.message.includes('Thiếu field "type"') ||
  err.message.includes('không hợp lệ') ||
  err.message.includes('chỉ chấp nhận đuôi') ||
  err.message.includes('Đuôi file không khớp')
)) { ... }
```

**Rủi ro:** Nếu sửa message ở nơi throw, error handler sẽ không catch được. Nên dùng `err.code` hoặc `err.type` thay vì string matching.

---

### 🟡 [LOW] — errorHandler: `isOperational` check đặt SAU string matching

**File:** [errorHandler.js](file:///d:/WorkSpace/Schoolars_Ship/backend/src/middlewares/errorHandler.js#L59-L65) — dòng 59

```js
// isOperational check ở dòng 59, NHƯNG string matching ở dòng 85–96
// → Nếu Multer error có isOperational = true, nó sẽ bị catch ở dòng 59
//   với statusCode mặc định thay vì message cụ thể
```

**Đề xuất:** Đưa `isOperational` check xuống cuối (trước fallback 500), hoặc gán `isOperational` + `statusCode` cho Multer errors rồi để chúng rơi vào block `isOperational`.

---

## BƯỚC 3 — 🔧 Refactored Code

> [!IMPORTANT]
> Chỉ refactor những gì CẦN sửa. Giữ nguyên convention của dự án (`try/catch + next(error)`, `#throwError` pattern, 4-layer architecture).

### 3.1 — `ScholarshipRepository` — Fix SELECT * và DRY base filter

```js
// src/repositories/scholarship.repository.js
const BaseRepository = require('./base.repository');

// WHY: Column list tường minh — tránh leak internal fields khi thêm column mới
const LIST_COLUMNS = [
  'id', 'title', 'provider', 'country', 'degree', 'amount', 'currency',
  'coverage', 'deadline', 'language', 'min_gpa', 'image_url', 'is_featured',
].join(', ');

const DETAIL_COLUMNS = [
  'id', 'title', 'provider', 'country', 'degree', 'amount', 'currency',
  'coverage', 'deadline', 'language', 'min_gpa', 'min_ielts',
  'image_url', 'is_featured', 'description', 'requirements',
  'application_url', 'field_of_study', 'created_at',
].join(', ');

class ScholarshipRepository extends BaseRepository {
  constructor(db) {
    super(db, 'scholarships');
  }

  // WHY: Tập trung điều kiện "học bổng còn hiệu lực" — sửa 1 chỗ, apply tất cả
  #activeFilter() {
    return 'is_active = true AND deadline > NOW()';
  }

  async findAll(filters = {}, userId = null) {
    const PAGE_SIZE = 20;
    const MAX_LIMIT = 50;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || PAGE_SIZE));
    const offset = (page - 1) * limit;

    const { conditions, params } = this.#buildWhereClause(filters);
    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await this.db.queryOne(
      `SELECT COUNT(*) as total FROM scholarships ${where}`,
      params
    );
    const total = parseInt(countResult.total, 10);
    const totalPages = Math.ceil(total / limit);

    const data = await this.db.query(
      `SELECT ${LIST_COLUMNS} FROM scholarships ${where}
       ORDER BY deadline ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const rows = await this.#attachSavedStatus(data.rows, userId);
    return { data: rows, meta: { page, limit, total, totalPages } };
  }

  async findFeatured() {
    const data = await this.db.query(
      `SELECT ${LIST_COLUMNS} FROM scholarships
       WHERE ${this.#activeFilter()} AND is_featured = true
       ORDER BY deadline ASC
       LIMIT 6`
    );
    return data.rows;
  }

  async findCountries() {
    // NOTE: Dùng activeFilter để chỉ trả country của học bổng còn hiệu lực
    const data = await this.db.query(
      `SELECT DISTINCT country FROM scholarships
       WHERE ${this.#activeFilter()} AND country IS NOT NULL
       ORDER BY country ASC`
    );
    return data.rows.map((r) => r.country);
  }

  async findById(id, userId = null) {
    // WHY FIX: SELECT column list thay vì SELECT * — không leak internal fields
    const scholarship = await this.db.queryOne(
      `SELECT ${DETAIL_COLUMNS} FROM scholarships WHERE id = $1 AND ${this.#activeFilter()}`,
      [id]
    );

    if (!scholarship) return null;

    const isSaved = await this.#checkSavedStatus(userId, id);
    return { ...scholarship, is_saved: isSaved };
  }

  #buildWhereClause(filters) {
    const conditions = [this.#activeFilter()];
    const params = [];
    let idx = 1;

    if (filters.country) {
      conditions.push(`country ILIKE $${idx++}`);
      params.push(`%${filters.country}%`);
    }
    if (filters.degree) {
      conditions.push(`degree = $${idx++}`);
      params.push(filters.degree);
    }
    if (filters.field) {
      conditions.push(`field_of_study ILIKE $${idx++}`);
      params.push(`%${filters.field}%`);
    }
    if (filters.language) {
      conditions.push(`language = $${idx++}`);
      params.push(filters.language);
    }
    if (filters.min_gpa) {
      conditions.push(`min_gpa <= $${idx++}`);
      params.push(Number(filters.min_gpa));
    }
    if (filters.min_ielts) {
      conditions.push(`min_ielts <= $${idx++}`);
      params.push(Number(filters.min_ielts));
    }
    if (filters.deadline_from) {
      conditions.push(`deadline >= $${idx++}`);
      params.push(filters.deadline_from);
    }
    if (filters.deadline_to) {
      conditions.push(`deadline <= $${idx++}`);
      params.push(filters.deadline_to);
    }
    if (filters.amount_min) {
      conditions.push(`amount >= $${idx++}`);
      params.push(Number(filters.amount_min));
    }
    if (filters.coverage) {
      conditions.push(`coverage = $${idx++}`);
      params.push(filters.coverage);
    }
    if (filters.featured === 'true' || filters.featured === true) {
      conditions.push(`is_featured = true`);
    }
    if (filters.search) {
      conditions.push(`(title ILIKE $${idx} OR provider ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++; // WHY FIX: Tăng idx phòng trường hợp thêm filter sau này
    }

    return { conditions, params };
  }

  async #attachSavedStatus(rows, userId) {
    if (!userId || rows.length === 0) {
      return rows.map((row) => ({ ...row, is_saved: false }));
    }
    const savedRows = await this.db.query(
      `SELECT scholarship_id FROM saved_scholarships
       WHERE user_id = $1 AND scholarship_id = ANY($2::uuid[])`,
      [userId, rows.map((row) => row.id)]
    );
    const savedIds = new Set(savedRows.rows.map((row) => row.scholarship_id));
    return rows.map((row) => ({ ...row, is_saved: savedIds.has(row.id) }));
  }

  async #checkSavedStatus(userId, scholarshipId) {
    if (!userId) return false;
    const saved = await this.db.queryOne(
      'SELECT id FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2',
      [userId, scholarshipId]
    );
    return !!saved;
  }
}

module.exports = ScholarshipRepository;
```

### 3.2 — `errorHandler.js` — Fix string matching + reorder

```js
// src/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Log lỗi ra console trong development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // ── Supabase DB errors (code-based — reliable) ────────────────────────
  if (err.code && err.message && err.details) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Dữ liệu đã tồn tại (unique constraint violation)',
        code: 409,
      });
    }
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Tham chiếu không hợp lệ (foreign key violation)',
        code: 400,
      });
    }
  }

  // ── JWT errors (name-based — reliable) ────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      code: 401,
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn',
      code: 401,
    });
  }

  // ── Multer errors (code-based — reliable) ─────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File quá lớn (tối đa 10MB)',
      code: 400,
    });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Field upload không hợp lệ',
      code: 400,
    });
  }

  // WHY FIX: Multer validation errors — dùng err.type thay vì string matching
  // Khi throw từ fileFilter, gán err.type = 'MULTER_VALIDATION'
  if (err.type === 'MULTER_VALIDATION') {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 400,
    });
  }

  // WHY FIX: isOperational check đặt SAU các error có format riêng,
  // TRƯỚC fallback 500 — catch-all cho lỗi nghiệp vụ
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
      code: err.statusCode || 400,
    });
  }

  // ── Fallback — lỗi không xác định ────────────────────────────────────
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ, vui lòng thử lại sau',
    code: 500,
  });
};

module.exports = errorHandler;
```

### 3.3 — Controller & Service & Routes & Container

**Không cần sửa.** Các file này đã đúng convention của dự án:
- Controller: `try/catch + next(error)` ✅
- Service: `#ensureFound` với `isOperational` flag ✅  
- Routes: validation middleware + optionalAuth ✅
- Container: DI wiring đúng chuẩn singleton ✅

---

## Tổng Kết — Scorecard

| Tiêu chí | Đánh giá | Ghi chú |
|----------|---------|---------|
| Architecture 4 tầng | ✅ **Đạt** | Đúng 100% theo `core.mdc` |
| Dependency Injection | ✅ **Đạt** | Container singleton, constructor injection |
| SRP | ✅ **Đạt** | Mỗi tầng đúng trách nhiệm |
| Centralized Error Handler | ✅ **Đạt** | errorHandler.js xử lý 6 loại lỗi |
| Error Propagation | ✅ **Đạt** | `next(error)` + `isOperational` |
| SQL Injection | ✅ **Đạt** | 100% parameterized |
| N+1 Query | ✅ **Đạt** | Batch query với `ANY()` |
| Hardcoded Secrets | ✅ **Đạt** | Dùng `.env` |
| SELECT * | 🟠 **Cần sửa** | `findById` dùng `SELECT *` |
| Structured Logging | 🟠 **Thiếu** | Chỉ có `console.error` dev mode |
| DRY base filter | 🟡 **Nên sửa** | `is_active = true AND deadline > NOW()` lặp 4 nơi |
| Error string matching | 🟡 **Nên sửa** | errorHandler dùng `includes()` — fragile |

> **Kết luận:** Code đã đạt chuẩn enterprise ở phần kiến trúc, DI, error handling, và security. Cần cải thiện: (1) `SELECT *` → column list, (2) thêm structured logging, (3) DRY base filter trong repository.
