import { success, created } from '~/utils/responseHelper.js';
import documentService from '~/services/document.service.js';

class DocumentController {
  async getAll(req, res) {
    const data = await documentService.getAll(req.user.id);
    return success(res, data);
  }

  async upload(req, res) {
    const data = await documentService.upload(req.user.id, req.body.type, req.file);
    return created(res, data, 'Document uploaded');
  }

  async remove(req, res) {
    await documentService.remove(req.user.id, req.params.id);
    return success(res, null, 'Document deleted');
  }
}

export default new DocumentController();