import { Router } from 'express';
import applicationController from '#controllers/application.controller.js';
import { auth } from '#middlewares/auth.js';
import validate from '#middlewares/validate.js';
import { applicationCreateSchema, applicationUpdateSchema, applicationQuerySchema } from '#validations/application.validation.js';

const router = Router();

// Query: page, limit, status
router.get('/', auth, validate(applicationQuerySchema, 'query'), applicationController.getAll);

// Mặc định status = 'draft'. Nhận cả scholarship_id (V1) và scholarshipId (V2) để FE cũ vẫn chạy
router.post(
  '/',
  auth,
  validate(applicationCreateSchema),
  (req, res, next) => {
    req.body = {
      ...req.body,
      scholarshipId: req.body.scholarshipId || req.body.scholarship_id,
    };
    next();
  },
  applicationController.create
);

router.get('/:id', auth, applicationController.getById);

router.patch('/:id', auth, validate(applicationUpdateSchema), applicationController.update);

router.delete('/:id', auth, applicationController.remove);

export default router;