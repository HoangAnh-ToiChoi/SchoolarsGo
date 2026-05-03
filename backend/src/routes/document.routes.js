const { Router } = require('express');
const { documentController } = require('../container');
const { auth } = require('../middlewares/auth');
const { upload, handleUploadError } = require('../middlewares/upload');

const router = Router();

/**
 * GET /api/documents
 * @desc List user's documents
 */
router.get('/', auth, documentController.getAll);

/**
 * POST /api/documents/upload
 * @desc Upload a document
 *
 * Luồng xử lý lỗi:
 *  1. upload.single('file')  → parse multipart, chạy fileFilter
 *  2. handleUploadError()    → bắt lỗi từ fileFilter, trả JSON 400 thay vì crash
 *  3. auth                  → kiểm tra JWT token
 *  4. documentController   → xử lý business logic
 *
 * Nếu không có handleUploadError: lỗi từ fileFilter (MulterError hoặc Error thường)
 * sẽ không được format JSON, client nhận "Failed to fetch" thay vì message rõ ràng.
 */
router.post('/upload', auth, upload.single('file'), handleUploadError, documentController.upload);

/**
 * DELETE /api/documents/:id
 * @desc Delete a document
 */
router.delete('/:id', auth, documentController.remove);

module.exports = router;
