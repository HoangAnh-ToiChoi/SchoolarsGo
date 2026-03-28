const { Router } = require('express');
const savedController = require('../controllers/saved.controller');
const { auth } = require('../middlewares/auth');

const router = Router();

/**
 * GET /api/saved
 * @desc List saved scholarships
 */
router.get('/', auth, savedController.getAll);

/**
 * POST /api/saved/:scholarshipId
 * @desc Save a scholarship
 */
router.post('/:scholarshipId', auth, savedController.save);

/**
 * DELETE /api/saved/:scholarshipId
 * @desc Unsave a scholarship
 */
router.delete('/:scholarshipId', auth, savedController.remove);

module.exports = router;
