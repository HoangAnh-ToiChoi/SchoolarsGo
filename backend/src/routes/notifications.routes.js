/** NotificationRoutes — chuông thông báo trên header */
import { Router } from 'express';
import notificationController from '~/controllers/notification.controller.js';
import { auth } from '~/middlewares/auth.js';
import validate from '~/middlewares/validate.js';
import { notificationQuerySchema, notificationIdSchema } from '~/validations/notification.validation.js';

const router = Router();

router.get('/', auth, validate(notificationQuerySchema, 'query'), notificationController.getAll);

// Đặt trước /:id để "readAll" không bị hiểu là id
router.patch('/readAll', auth, notificationController.markAllRead);

router.patch('/:id/read', auth, validate(notificationIdSchema, 'params'), notificationController.markRead);

export default router;