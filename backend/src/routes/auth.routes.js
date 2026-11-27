import { Router } from 'express';
import authController from '~/controllers/auth.controller.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '~/validations/auth.validation.js';
import validate from '~/middlewares/validate.js';
import { auth } from '~/middlewares/auth.js';
import {
  loginLimiter,
  loginIpLimiter,
  registerLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  refreshLimiter,
} from '~/middlewares/rateLimiter.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginIpLimiter, loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.me);
router.get('/account', auth, authController.account);
router.get('/sessions', auth, authController.sessions);
router.delete('/sessions/:id', auth, authController.endSession);
router.post('/forgotPassword', forgotPasswordIpLimiter, forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/resetPassword', resetPasswordLimiter, validate(resetPasswordSchema), authController.resetPassword);

export default router;