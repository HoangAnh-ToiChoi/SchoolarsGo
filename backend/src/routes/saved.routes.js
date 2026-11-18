/**
 * SavedRoutes — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Tạo controller một lần ở đầu file, bind method trước khi gắn vào route
 * - Dùng middleware auth để lấy req.user.id
 */
const { Router } = require('express');
const SavedController = require('../controllers/saved.controller');
const bindControllerMethods = require('../utils/bindControllerMethods');
const savedController = bindControllerMethods(new SavedController());
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
