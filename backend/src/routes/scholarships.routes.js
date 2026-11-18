import { Router } from 'express';
import scholarshipController from '~/controllers/scholarship.controller.js';
import { optionalAuth } from '~/middlewares/auth.js';
import validate from '~/middlewares/validate.js';
import { scholarshipQuerySchema } from '~/validations/scholarship.validation.js';

const router = Router();

router.get(
  '/',
  optionalAuth,
  validate(scholarshipQuerySchema, 'query'),
  scholarshipController.getAll
);

router.get('/featured', scholarshipController.getFeatured);

router.get('/countries', scholarshipController.getCountries);

// :id là UUID hoặc slug
router.get('/:id', optionalAuth, scholarshipController.getById);

export default router;