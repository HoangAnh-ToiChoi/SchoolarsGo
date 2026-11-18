import { Router } from 'express';
import profileController from '~/controllers/profile.controller.js';
import { auth } from '~/middlewares/auth.js';
import validate from '~/middlewares/validate.js';
import { profileUpdateSchema } from '~/validations/profile.validation.js';

const router = Router();

router.get('/', auth, profileController.getProfile);

router.put('/', auth, validate(profileUpdateSchema), profileController.updateProfile);

export default router;