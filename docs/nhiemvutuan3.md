# Nhiệm vụ Tuần 3 — ScholarsGo Backend

> **Ngày:** 4/4/2026
> **Thành viên:** Ngơ (Backend Developer)
> **Trạng thái:** ✅ Hoàn thành

---

## Tổng quan

Tuần 3 yêu cầu implement các API cốt lõi cho hệ thống xác thực (Auth) và danh sách học bổng (Scholarships), sử dụng **Node.js + Express**, **Raw SQL + pg connection pool** (không dùng `@supabase/supabase-js`), **bcryptjs** + **jsonwebtoken**, và **Zod** để validate.

**Tech stack:**
- Database: PostgreSQL via `pg` (connection pool tại `src/utils/db.js`)
- Auth: `bcryptjs` (hash password, salt rounds = 12) + `jsonwebtoken` (JWT payload: `{ id, email }`)
- Validate: `zod`
- Rate limit: `express-rate-limit`

---

## Nhiệm vụ 1: Auth Middleware

**File:** `backend/src/middlewares/auth.js`

Middleware `auth` xác thực JWT từ header `Authorization: Bearer <token>` hoặc cookie. Nếu lỗi trả về **401**, nếu thành công gán `req.user = decoded`.

```javascript
const auth = (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục', code: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn', code: 401 });
    }
    return res.status(401).json({ success: false, message: 'Token không hợp lệ', code: 401 });
  }
};
```

Middleware `optionalAuth` — gắn user nếu có token, không thì bỏ qua (dùng cho các route vừa public vừa có thể personalize).

---

## Nhiệm vụ 2: API Xác thực (Auth)

### 2.1. Rate Limiter

**File:** `backend/src/middlewares/rateLimiter.js`

Factory function tạo rate limiter per-route, dùng `express-rate-limit`.

```javascript
const rateLimiter = (maxRequests = 100, windowMs = 60, message) => {
  return rateLimit({
    windowMs: windowMs * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message, code: 429 },
    skip: (req) => req.path === '/api/health',
  });
};
```

**Rate limits:**
| Endpoint | Limit |
|----------|-------|
| POST /api/auth/register | 3 req/phút/IP |
| POST /api/auth/login | 5 req/phút/IP |
| Tất cả endpoint khác | 100 req/phút |

### 2.2. Validators

**File:** `backend/src/utils/validators.js`

```javascript
const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(255),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(128),
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(255),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});
```

### 2.3. Auth Service

**File:** `backend/src/services/auth.service.js`

```javascript
const SALT_ROUNDS = 12;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (email, password, fullName) => {
  // Check email tồn tại
  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) { throw Object.assign(new Error('Email đã được sử dụng'), { statusCode: 409, isOperational: true }); }

  // Hash password + INSERT
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await queryOne(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3)
     RETURNING id, email, full_name, avatar_url, phone, date_of_birth, created_at`,
    [email, passwordHash, fullName]
  );

  const token = generateToken(user);
  return { user: { id: user.id, email: user.email, full_name: user.full_name }, token };
};

const login = async (email, password) => {
  // Query user
  const user = await queryOne(
    'SELECT id, email, password_hash, full_name FROM users WHERE email = $1',
    [email]
  );
  if (!user) { throw Object.assign(new Error('Email hoặc mật khẩu không đúng'), { statusCode: 401, isOperational: true }); }

  // bcrypt.compare
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) { throw Object.assign(new Error('Email hoặc mật khẩu không đúng'), { statusCode: 401, isOperational: true }); }

  const token = generateToken(user);
  return { user: { id: user.id, email: user.email, full_name: user.full_name }, token };
};
```

### 2.4. Auth Controller

**File:** `backend/src/controllers/auth.controller.js`

```javascript
const register = async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;
    const result = await authService.register(email, password, full_name);
    return created(res, { user: result.user, token: result.token }, 'Đăng ký thành công');
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, { user: result.user, token: result.token }, 'Đăng nhập thành công');
  } catch (error) { next(error); }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return success(res, user);
  } catch (error) { next(error); }
};
```

### 2.5. Auth Routes

**File:** `backend/src/routes/auth.routes.js`

```javascript
router.post('/register',
  rateLimiter(3, 60, 'Too many registrations, please try again later.'),
  validate(registerSchema),
  authController.register
);

router.post('/login',
  rateLimiter(5, 60, 'Too many login attempts, please try again later.'),
  validate(loginSchema),
  authController.login
);

router.get('/me', auth, authController.me);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
```

---

## Nhiệm vụ 3: API Học bổng (Scholarships)

### 3.1. Scholarship Service

**File:** `backend/src/services/scholarship.service.js`

```javascript
const PAGE_SIZE = 20;
const MAX_LIMIT = 50;

const getAll = async (filters) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || PAGE_SIZE));
  const offset = (page - 1) * limit;

  // Dynamic filter builder — chỉ thêm điều kiện khi filter có giá trị
  const conditions = ['is_active = true', 'deadline > NOW()'];
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
    idx++;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  // COUNT(*) → lấy total cho meta pagination
  const countResult = await queryOne(`SELECT COUNT(*) as total FROM scholarships ${where}`, params);
  const total = parseInt(countResult.total, 10);
  const totalPages = Math.ceil(total / limit);

  // SELECT với LIMIT/OFFSET phân trang
  const selectCols = [
    'id', 'title', 'provider', 'country', 'degree', 'amount', 'currency',
    'coverage', 'deadline', 'language', 'min_gpa', 'image_url', 'is_featured',
  ].join(', ');

  const data = await query(
    `SELECT ${selectCols} FROM scholarships ${where} ORDER BY deadline ASC LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset]
  );

  return { data: data.rows, meta: { page, limit, total, totalPages } };
};

const getById = async (id, userId) => {
  const scholarship = await queryOne(
    'SELECT * FROM scholarships WHERE id = $1 AND is_active = true AND deadline > NOW()',
    [id]
  );
  if (!scholarship) {
    throw Object.assign(new Error('Không tìm thấy học bổng'), { statusCode: 404, isOperational: true });
  }

  let isSaved = false;
  if (userId) {
    const saved = await queryOne(
      'SELECT id FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2',
      [userId, id]
    );
    isSaved = !!saved;
  }
  return { ...scholarship, is_saved: isSaved };
};
```

**Response format chuẩn:**
```json
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 53, "totalPages": 3 }
}
```

### 3.2. Scholarship Routes

**File:** `backend/src/routes/scholarship.routes.js`

| Method | Path | Handler | Mô tả |
|--------|------|---------|-------|
| GET | `/` | `validate(scholarshipQuerySchema, 'query')` → `getAll` | List + filters + pagination |
| GET | `/featured` | `getFeatured` | Top 6 featured |
| GET | `/countries` | `getCountries` | Distinct country list |
| GET | `/:id` | `getById` | Detail (is_active + deadline check) |

### 3.3. Bugs đã fix

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `scholarship.service.js` | `getById` thiếu điều kiện `is_active` và `deadline > NOW()` | Thêm `AND is_active = true AND deadline > NOW()` vào WHERE |
| 2 | `scholarship.service.js` | `getAll` dùng `deadline >= now()` → hiển thị học bổng hết hạn cùng ngày | Đổi thành `deadline > NOW()` |
| 3 | `validators.js` | `registerSchema` password min 8 chars | Đổi thành `min(6)` theo yêu cầu |

---

## Nhiệm vụ 4: Test API File

**File:** `backend/test-api.http`

File REST Client cho VSCode, chứa **22 request mẫu** để test nhanh tất cả API.

### Cách dùng
1. Cài extension **REST Client** trên VSCode
2. Mở `backend/test-api.http`
3. Nhấn **Send Request** (`Ctrl+Alt+R`) trên từng block
4. Biến `{{authToken}}` được tự động lưu sau khi register/login thành công

### Danh sách request

```
AUTH
  POST /auth/register           ← Tạo tài khoản mới (guid email)
  POST /auth/login             ← Đăng nhập (lưu token tự động)
  GET  /auth/me                ← Lấy profile (không token → 401)
  GET  /auth/me                ← Lấy profile (có token → 200)

SCHOLARSHIPS — List
  GET /scholarships                          ← Không filter, page=1 limit=20
  GET /scholarships?country=USA              ← Filter: country (case-insensitive)
  GET /scholarships?degree=Master&country=UK   ← Filter: kết hợp
  GET /scholarships?min_gpa=3.5              ← Filter: min_gpa (so sánh <=)
  GET /scholarships?search=Fulbright         ← Filter: search title/provider (ILIKE %%)
  GET /scholarships?language=English         ← Filter: language
  GET /scholarships?country=USA&degree=Master&min_gpa=3.0&search=Engineering   ← Filter: kết hợp nhiều
  GET /scholarships?page=2&limit=10         ← Phân trang tùy chỉnh
  GET /scholarships?featured=true            ← Filter: học bổng nổi bật
  GET /scholarships?coverage=Full            ← Filter: coverage
  GET /scholarships/featured                 ← Học bổng nổi bật (top 6)
  GET /scholarships/countries                ← Danh sách quốc gia có sẵn

SCHOLARSHIPS — Detail
  GET /scholarships/:id                      ← Chi tiết (không auth)
  GET /scholarships/:id                      ← Chi tiết + is_saved (có auth)

SYSTEM
  GET /api/health                            ← Health check
```

---

## Cấu trúc file thay đổi

```
backend/src/
├── controllers/
│   ├── auth.controller.js         ✅ Đã có (Week 3)
│   └── scholarship.controller.js  ✅ Đã có (Week 3)
├── routes/
│   ├── auth.routes.js             ✅ Đã có (Week 3)
│   └── scholarship.routes.js      ✅ Đã có (Week 3)
├── middlewares/
│   ├── auth.js                    ✅ Đã có (Week 3)
│   └── rateLimiter.js            ✅ Đã có (Week 3)
├── services/
│   ├── auth.service.js           ✅ Đã có (Week 3)
│   └── scholarship.service.js    ✅ Sửa (Week 3)
└── utils/
    ├── validators.js              ✅ Sửa: password min 6 (Week 3)
    ├── db.js                     ✅ Đã có (pool + parameterized queries)
    └── responseHelper.js         ✅ Đã có

backend/
├── test-api.http                 ✅ Tạo mới (Week 3)
└── .env.example                  ✅ Đã có
```

---

## Check trước khi chạy

1. **Database:** Supabase local Docker đang chạy (`docker-compose up -d`)
2. **Environment:** Copy `backend/.env.example` → `backend/.env`, điền:
   - `JWT_SECRET` (ít nhất 32 ký tự)
   - `JWT_EXPIRES_IN=7d`
   - `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`
3. **Backend:** `cd backend && npm install && npm run dev`
4. **Test:** Mở `test-api.http`, nhấn `Ctrl+Alt+R` trên block Register → Login → Scholarships
