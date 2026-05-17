/**
 * SavedRoutes — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Import controller từ container.js (Singleton)
 * - Dùng middleware auth để lấy req.user.id
 */
const { Router } = require('express');
const { savedController } = require('../container');
const { auth } = require('../middlewares/auth');

const router = Router();

/**
 * GET /api/saved
 * Lấy danh sách scholarships đã lưu của user
 */
router.get('/', auth, savedController.getAll);

/**
 * POST /api/saved/:scholarshipId
 * Lưu một scholarship
 */
router.post('/:scholarshipId', auth, savedController.save);

/**
 * DELETE /api/saved/:scholarshipId
 * Bỏ lưu một scholarship
 */
router.delete('/:scholarshipId', auth, savedController.remove);

module.exports = router;
