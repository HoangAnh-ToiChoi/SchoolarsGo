const { Router } = require('express');
const scholarshipController = require('../controllers/scholarship.controller');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { scholarshipQuerySchema } = require('../utils/validators');

const router = Router();

/**
 * GET /api/scholarships
 * @desc List scholarships with filters (public)
 */
router.get('/', validate(scholarshipQuerySchema, 'query'), scholarshipController.getAll);

/**
 * GET /api/scholarships/featured
 * @desc Get featured scholarships (public)
 */
router.get('/featured', scholarshipController.getFeatured);

/**
 * GET /api/scholarships/countries
 * @desc Get list of available countries (public)
 */
router.get('/countries', scholarshipController.getCountries);

/**
 * GET /api/scholarships/:id
 * @desc Get scholarship detail (public)
 */
router.get('/:id', scholarshipController.getById);

module.exports = router;
