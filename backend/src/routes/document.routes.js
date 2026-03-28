const { Router } = require('express');
const documentController = require('../controllers/document.controller');
const { auth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = Router();

/**
 * GET /api/documents
 * @desc List user's documents
 */
router.get('/', auth, documentController.getAll);

/**
 * POST /api/documents/upload
 * @desc Upload a document
 */
router.post('/upload', auth, upload.single('file'), documentController.upload);

/**
 * DELETE /api/documents/:id
 * @desc Delete a document
 */
router.delete('/:id', auth, documentController.remove);

module.exports = router;
