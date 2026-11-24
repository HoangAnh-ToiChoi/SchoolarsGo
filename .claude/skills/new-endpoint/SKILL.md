---
name: new-endpoint
description: Thêm endpoint/nhóm API backend ScholarsGo đúng luồng route → controller → service → model + validation zod + contract test, theo đúng mẫu saved.*. Dùng khi người dùng muốn thêm API, route, hoặc gõ /new-endpoint <mô tả>.
argument-hint: "<nhóm> <method> <đường dẫn> — mô tả"
---

# Endpoint mới — ScholarsGo

Đọc mục "Backend" trong CLAUDE.md. Mẫu tham chiếu: `backend/src/{routes/saved.routes.js, controllers/saved.controller.js, services/saved.service.js, models/saved.model.js}`, `validations/notification.validation.js`, `tests/contracts/notification.contract.test.js`.

## 0. Làm rõ (hỏi nếu `$ARGUMENTS` chưa nói)
- Ai được gọi: công khai / `optionalAuth` / `auth` / admin?
- Dữ liệu thuộc về người dùng? (→ lọc `user_id`, không thấy → 404)
- Bảng/cột dùng tới; cần cột/index mới? (→ `/new-migration` trước)
- Cập nhật `docs/api.md` không? (code là đúng, nhưng tài liệu nên theo)

## 1. Thứ tự viết (test trước theo TDD)

1. **validation** `validations/<nhóm>.validation.js`: schema zod cho body/query/params; id → `z.string().uuid('…')`; query số → `z.coerce.number()` có min/max. Xuất `export { aSchema, bSchema }`.
2. **test** `tests/contracts/<nhóm>.contract.test.js`: đúng / đầu vào sai / không tìm thấy (xem agent `be-test-writer`). Chạy → đỏ.
3. **model** `models/<nhóm>.model.js`: class, mỗi hàm `getSupabase()` riêng, chọn cột cụ thể, `if (error) throw error;`, hàm của người dùng nhận `userId` (`findByIdAndUser(id, userId)`). Cuối file `export default new XModel();`.
4. **service** `services/<nhóm>.service.js`: nghiệp vụ, `AppError.notFound(message, 'MA_LOI')`…; gọi model đã import; đọc song song `Promise.all`. `export default new XService();`.
5. **controller** `controllers/<nhóm>.controller.js`: `async ten(req, res) { const data = await xService.y(req.user.id, …); return res.success(data); }` — không try/catch, không nghiệp vụ.
6. **route** `routes/<nhóm>.routes.js` (tự nạp thành `/<nhóm>`): `router.get('/', auth, validate(schema, 'query'), controller.list)`; admin → `router.use(auth, requireRole('admin'))` đầu file.
7. Mã lỗi dựng sẵn mới → `constants/errors.js`.

## 2. Ràng buộc
- `async function` / method `async ten() {}`; không async arrow. Import `~/…` có đuôi `.js`.
- Ngưỡng: controller 100 · service 200 · model 250 dòng — sắp vượt thì tách nhóm.
- Lọc phức tạp → mẫu 2 bước (CLAUDE.md "Query").

## 3. Kết thúc
Chạy `/verify` (BE lint + test:contract). Báo lại: file đã tạo, route + quyền, mã lỗi mới, test đã thêm.
