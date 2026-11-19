import { Router } from 'express';
import authController from '~/controllers/auth.controller.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '~/validations/auth.validation.js';
import validate from '~/middlewares/validate.js';
import { auth } from '~/middlewares/auth.js';
import { authLimiter, refreshLimiter } from '~/middlewares/rateLimiter.js';

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

export default router;