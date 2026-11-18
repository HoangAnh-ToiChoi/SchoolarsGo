const { Router } = require('express');
const ProfileController = require('../controllers/profile.controller');
const bindControllerMethods = require('../utils/bindControllerMethods');
const profileController = bindControllerMethods(new ProfileController());
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { profileUpdateSchema } = require('../validations/profile.validation');

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
