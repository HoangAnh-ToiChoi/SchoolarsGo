const { success, created } = require('../utils/responseHelper');

class DocumentController {
  #service;

  constructor(documentService) {
    this.#service = documentService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#service) throw new Error('DocumentService is required');
  }

  getAll = async (req, res, next) => {
    try {
      const data = await this.#service.getAll(req.user.id);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };

  upload = async (req, res, next) => {
    try {
      const data = await this.#service.upload(req.user.id, req.body.type, req.file);
      return created(res, data, 'Document uploaded');
    } catch (error) {
      next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      await this.#service.remove(req.user.id, req.params.id);
      return success(res, null, 'Document deleted');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = DocumentController;
