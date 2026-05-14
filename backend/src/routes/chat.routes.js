const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const { auth } = require('../middlewares/auth');
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Quá nhiều tin nhắn, vui lòng thử lại sau 1 phút' },
});

const router = Router();

router.post('/', auth, chatLimiter, chatController.sendMessage);

module.exports = router;
