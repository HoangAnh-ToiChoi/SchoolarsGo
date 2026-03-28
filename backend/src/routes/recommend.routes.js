const { Router } = require('express');
const recommendController = require('../controllers/recommend.controller');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { recommendSchema } = require('../utils/validators');

const router = Router();

/**
 * POST /api/recommend
 * @desc Get scholarship recommendations based on user profile (AI or rule-based)
 */
router.post('/', auth, validate(recommendSchema), recommendController.recommend);

module.exports = router;
