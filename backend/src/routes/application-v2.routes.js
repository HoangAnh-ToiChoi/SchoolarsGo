/**
 * ApplicationRoutes — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Dùng middleware auth để lấy req.user.id
 * - Validate request body/query bằng Zod schemas
 * - Controller nhận req → gọi service → trả res JSON
 */
const { Router } = require('express');
const applicationController = require('../controllers/application-v2.controller');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { applicationCreateSchema, applicationUpdateSchema, applicationQuerySchema } = require('../utils/validators');

const router = Router();

/**
 * GET /api/v2/applications
 * Lấy danh sách đơn của user đang đăng nhập (kèm phân trang).
 * Query params: page, limit, status
 */
router.get(
  '/',
  auth,
  validate(applicationQuerySchema, 'query'),
  (req, res) => applicationController.getAll(req, res)
);

/**
 * POST /api/v2/applications
 * Tạo đơn ứng tuyển mới (mặc định status = 'draft').
 */
router.post(
  '/',
  auth,
  validate(applicationCreateSchema),
  (req, res) => applicationController.create(req, res)
);

/**
 * GET /api/v2/applications/:id
 * Lấy chi tiết 1 đơn.
 */
router.get(
  '/:id',
  auth,
  (req, res) => applicationController.getById(req, res)
);

/**
 * PATCH /api/v2/applications/:id
 * Cập nhật đơn (status, checklist, notes...).
 */
router.patch(
  '/:id',
  auth,
  validate(applicationUpdateSchema),
  (req, res) => applicationController.update(req, res)
);

/**
 * DELETE /api/v2/applications/:id
 * Xóa đơn ứng tuyển (chỉ khi thuộc user đang đăng nhập).
 */
router.delete(
  '/:id',
  auth,
  (req, res) => applicationController.remove(req, res)
);

module.exports = router;
