import { Router } from 'express';
import chatController from '~/controllers/chat.controller.js';
import { auth } from '~/middlewares/auth.js';
import validate from '~/middlewares/validate.js';
import { chatSchema } from '~/validations/chat.validation.js';
import { createLimiter } from '~/middlewares/rateLimiter.js';
import { CHAT_RATE_LIMIT } from '~/constants/chat.js';

const chatLimiter = createLimiter(CHAT_RATE_LIMIT.max, CHAT_RATE_LIMIT.windowSeconds, CHAT_RATE_LIMIT.message);

const router = Router();

router.get('/history', auth, chatController.getChatHistory);
router.post('/', auth, chatLimiter, validate(chatSchema), chatController.sendMessage);

export default router;