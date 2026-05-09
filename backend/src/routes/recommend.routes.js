const { Router } = require('express');
const { recommendController } = require('../container');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { recommendSchema } = require('../utils/validators');

const router = Router();

/**
 * POST /api/recommend
 * @desc Get scholarship recommendations based on user profile (AI or rule-based)
 */
router.post('/', auth, validate(recommendSchema), (req, res, next) =>
  recommendController.recommend(req, res, next)
);

module.exports = router;
