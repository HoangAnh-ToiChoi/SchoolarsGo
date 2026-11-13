const { Router } = require('express');
const { authController } = require('../container');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../utils/validators');
const validate = require('../middlewares/validate');
const { auth } = require('../middlewares/auth');
const { authLimiter, refreshLimiter } = require('../middlewares/rateLimiter');

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.me);
router.get('/account', auth, authController.account);
router.get('/sessions', auth, authController.sessions);
router.delete('/sessions/:id', auth, authController.endSession);
router.post('/forgotPassword', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/resetPassword', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
