import { Router } from 'express';
import recommendController from '~/controllers/recommend.controller.js';
import { auth } from '~/middlewares/auth.js';
import validate from '~/middlewares/validate.js';
import { recommendSchema } from '~/validations/recommend.validation.js';

const router = Router();

router.post('/', auth, validate(recommendSchema), (req, res, next) =>
  recommendController.recommend(req, res, next)
);

export default router;