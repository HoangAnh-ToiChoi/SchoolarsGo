const { Router } = require('express');
const RecommendController = require('../controllers/recommend.controller');
const bindControllerMethods = require('../utils/bindControllerMethods');
const recommendController = bindControllerMethods(new RecommendController());
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { recommendSchema } = require('../validations/recommend.validation');

const router = Router();

/**
 * POST /api/recommend
 * @desc Get scholarship recommendations based on user profile (AI or rule-based)
 */
router.post('/', auth, validate(recommendSchema), (req, res, next) =>
  recommendController.recommend(req, res, next)
);

module.exports = router;
