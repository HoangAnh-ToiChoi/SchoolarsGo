const { Router } = require('express');
const applicationController = require('../controllers/application.controller');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { applicationCreateSchema, applicationUpdateSchema, applicationQuerySchema } = require('../utils/validators');

const router = Router();

/**
 * GET /api/applications
 * @desc List user's applications
 */
router.get('/', auth, validate(applicationQuerySchema, 'query'), applicationController.getAll);

/**
 * POST /api/applications
 * @desc Create new application
 */
router.post('/', auth, validate(applicationCreateSchema), applicationController.create);

/**
 * GET /api/applications/:id
 * @desc Get application detail
 */
router.get('/:id', auth, applicationController.getById);

/**
 * PATCH /api/applications/:id
 * @desc Update application
 */
router.patch('/:id', auth, validate(applicationUpdateSchema), applicationController.update);

/**
 * DELETE /api/applications/:id
 * @desc Delete application
 */
router.delete('/:id', auth, applicationController.remove);

module.exports = router;
