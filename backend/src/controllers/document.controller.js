/**
 * DocumentController — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * HTTP handling, KHÔNG chứa business logic — chỉ nhận req/res, gọi service.
 * Inject: documentService qua constructor.
 */

const { success, created } = require('../utils/responseHelper');

class DocumentController {
  constructor(documentService) {
    this.documentService = documentService;
  }

  // ─── PUBLIC — routes gọi (arrow functions) ──────────────────────────────

  getAll = async (req, res, next) => {
    try {
      const data = await this.documentService.getAll(req.user.id);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };

  upload = async (req, res, next) => {
    try {
      const data = await this.documentService.upload(req.user.id, req.body.type, req.file);
      return created(res, data, 'Document uploaded');
    } catch (error) {
      next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      await this.documentService.remove(req.user.id, req.params.id);
      return success(res, null, 'Document deleted');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new DocumentController();
