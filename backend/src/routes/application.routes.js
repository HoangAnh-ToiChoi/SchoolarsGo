/**
 * ApplicationRoutes — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Import controller từ container.js (Singleton)
 * - Dùng middleware auth để lấy req.user.id
 * - Validate request body/query bằng Zod schemas
 * - Controller nhận req → gọi service → trả res JSON
 */
const { Router } = require('express');
const { applicationController } = require('../container');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { applicationCreateSchema, applicationUpdateSchema, applicationQuerySchema } = require('../utils/validators');

const router = Router();

/**
 * GET /api/applications
 * Lấy danh sách đơn của user đang đăng nhập (kèm phân trang).
 * Query params: page, limit, status
 */
router.get(
  '/',
  auth,
  validate(applicationQuerySchema, 'query'),
  applicationController.getAll
);

/**
 * POST /api/applications
 * Tạo đơn ứng tuyển mới (mặc định status = 'draft').
 * Chấp nhận cả scholarship_id (V1) và scholarshipId (V2) để tương thích FE.
 */
router.post(
  '/',
  auth,
  validate(applicationCreateSchema),
  (req, res, next) => {
    req.body = {
      ...req.body,
      scholarshipId: req.body.scholarshipId || req.body.scholarship_id,
    };
    next();
  },
  applicationController.create
);

/**
 * GET /api/applications/:id
 * Lấy chi tiết 1 đơn.
 */
router.get(
  '/:id',
  auth,
  applicationController.getById
);

/**
 * PATCH /api/applications/:id
 * Cập nhật đơn (status, checklist, notes...).
 */
router.patch(
  '/:id',
  auth,
  validate(applicationUpdateSchema),
  applicationController.update
);

/**
 * DELETE /api/applications/:id
 * Xóa đơn ứng tuyển (chỉ khi thuộc user đang đăng nhập).
 */
router.delete(
  '/:id',
  auth,
  applicationController.remove
);

module.exports = router;
