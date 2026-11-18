import { Router } from 'express';
import savedController from '#controllers/saved.controller.js';
import { auth } from '#middlewares/auth.js';

const router = Router();

router.get('/', auth, savedController.getAll);

router.post('/:scholarshipId', auth, savedController.save);

router.delete('/:scholarshipId', auth, savedController.remove);

export default router;