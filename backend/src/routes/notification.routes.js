/**
 * NotificationRoutes — chuông thông báo trên header
 */
const { Router } = require('express');
const { notificationController } = require('../container');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { notificationQuerySchema, notificationIdSchema } = require('../utils/validators');

const router = Router();

/**
 * GET /api/notifications?limit=30
 * Danh sách thông báo (mới nhất trước) + meta.unread = số chưa đọc
 */
router.get('/', auth, validate(notificationQuerySchema, 'query'), notificationController.getAll);

/**
 * PATCH /api/notifications/readAll
 * Đánh dấu tất cả đã đọc (đặt trước /:id để không bị hiểu "readAll" là id)
 */
router.patch('/readAll', auth, notificationController.markAllRead);

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', auth, validate(notificationIdSchema, 'params'), notificationController.markRead);

module.exports = router;
