import { Router } from 'express';
import documentController from '#controllers/document.controller.js';
import { auth } from '#middlewares/auth.js';
import { upload, handleUploadError } from '#middlewares/upload.js';
import { uploadLimiter } from '#middlewares/rateLimiter.js';

const router = Router();

router.get('/', auth, documentController.getAll);

// Thứ tự quan trọng: auth → upload (đọc multipart) → handleUploadError (đổi lỗi multer thành JSON 400, thiếu thì client chỉ thấy "Failed to fetch") → controller
router.post(
  '/upload',
  uploadLimiter,
  auth,
  upload.single('file'),
  handleUploadError,
  documentController.upload
);

router.delete('/:id', auth, documentController.remove);

export default router;