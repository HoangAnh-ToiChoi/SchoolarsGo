const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { registerSchema, loginSchema } = require('../utils/validators');
const validate = require('../middlewares/validate');
const { auth } = require('../middlewares/auth');
const rateLimiter = require('../middlewares/rateLimiter');

const router = Router();

/**
 * POST /api/auth/register
 * @desc Register new user
 */
router.post('/register', rateLimiter(3, 60, 'Too many registrations, please try again later.'), validate(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * @desc Login with email/password
 */
router.post('/login', rateLimiter(5, 60, 'Too many login attempts, please try again later.'), validate(loginSchema), authController.login);

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
router.post('/refresh', authController.refresh);

module.exports = router;
