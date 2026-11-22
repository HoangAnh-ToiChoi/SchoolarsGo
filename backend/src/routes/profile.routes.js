import { Router } from 'express';
import profileController from '~/controllers/profile.controller.js';
import { auth } from '~/middlewares/auth.js';
import validate from '~/middlewares/validate.js';
import { cvUpload } from '~/middlewares/cvUpload.js';
import { handleUploadError } from '~/middlewares/upload.js';
import { cvLimiter } from '~/middlewares/rateLimiter.js';
import { profileUpdateSchema } from '~/validations/profile.validation.js';

const router = Router();

router.get('/', auth, profileController.getProfile);

// Thứ tự quan trọng: auth (có req.user cho cvLimiter) → giới hạn lượt → đọc multipart → đổi lỗi multer thành JSON 400 → controller
router.post('/cv', auth, cvLimiter, cvUpload, handleUploadError, profileController.parseCv);

router.put('/', auth, validate(profileUpdateSchema), profileController.updateProfile);

export default router;