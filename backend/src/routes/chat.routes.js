import { Router } from 'express';
import chatController from '~/controllers/chat.controller.js';
import { auth } from '~/middlewares/auth.js';
import rateLimit from 'express-rate-limit';
import { ApiResponse } from '~/utils/responseHelper.js';

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: ApiResponse.error({ message: 'Quá nhiều tin nhắn, vui lòng thử lại sau 1 phút', code: 429, errorCode: 'TOO_MANY_REQUESTS' }),
});

const router = Router();

router.get('/history', auth, chatController.getChatHistory);
router.post('/', auth, chatLimiter, chatController.sendMessage);

export default router;