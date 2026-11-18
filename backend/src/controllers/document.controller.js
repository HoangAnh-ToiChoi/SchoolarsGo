import documentService from '~/services/document.service.js';

class DocumentController {
  async getAll(req, res) {
    const data = await documentService.getAll(req.user.id);
    return res.success(data);
  }

  async upload(req, res) {
    const data = await documentService.upload(req.user.id, req.body.type, req.file);
    return res.created(data, 'Document uploaded');
  }

  async remove(req, res) {
    await documentService.remove(req.user.id, req.params.id);
    return res.success(null, 'Document deleted');
  }
}

export default new DocumentController();