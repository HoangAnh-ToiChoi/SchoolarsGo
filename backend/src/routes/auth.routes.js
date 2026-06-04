const { Router } = require('express');
const { authController } = require('../container');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../utils/validators');
const validate = require('../middlewares/validate');
const { auth } = require('../middlewares/auth');
const rateLimiter = require('../middlewares/rateLimiter');
const { authLimiter } = rateLimiter;

const router = Router();

/**
 * POST /api/auth/register
 * @desc Register new user
 */
router.post('/register', authLimiter, validate(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * @desc Login with email/password
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/oauth/facebook/start', authController.startFacebookOAuth);
router.get('/oauth/facebook/callback', authController.facebookCallback);
router.get('/oauth/apple/start', authController.startAppleOAuth);
router.post('/oauth/apple/callback', authController.appleCallback);
router.get('/oauth/apple/callback', authController.appleCallback);

/**
 * GET /api/auth/me
 * @desc Get current user
 */
router.get('/me', auth, authController.me);

/**
 * POST /api/auth/logout
 * @desc Logout (clear cookie)
 */
router.post('/logout', authController.logout);

/**
 * POST /api/auth/refresh
 * @desc Refresh JWT token
 */
router.post('/refresh', auth, authController.refresh);

/**
 * POST /api/auth/forgot-password
 * @desc Send password reset email
 */
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * @desc Reset password with token
 */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
