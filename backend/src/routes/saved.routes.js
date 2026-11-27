import { Router } from 'express';
import savedController from '~/controllers/saved.controller.js';
import { auth } from '~/middlewares/auth.js';
import validate from '~/middlewares/validate.js';
import { savedParamsSchema, savedCreateSchema } from '~/validations/saved.validation.js';

const router = Router();

router.get('/', auth, savedController.getAll);

router.post('/:scholarshipId', auth, validate(savedParamsSchema, 'params'), validate(savedCreateSchema), savedController.save);

router.delete('/:scholarshipId', auth, validate(savedParamsSchema, 'params'), savedController.remove);

export default router;