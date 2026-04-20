const { Router } = require('express');
const { profileController } = require('../container');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { profileUpdateSchema } = require('../utils/validators');

const router = Router();

/**
 * GET /api/profile
 * @desc Get current user's profile
 */
router.get('/', auth, profileController.getProfile);

/**
 * PUT /api/profile
 * @desc Update current user's profile
 */
router.put('/', auth, validate(profileUpdateSchema), profileController.updateProfile);

module.exports = router;
