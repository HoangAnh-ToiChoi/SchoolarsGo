const documentService = require('../services/document.service');
const { success, created } = require('../utils/responseHelper');

const getAll = async (req, res, next) => {
  try {
    const data = await documentService.getAll(req.user.id);
    return success(res, data);
  } catch (error) {
    next(error);
  }
};

const upload = async (req, res, next) => {
  try {
    const data = await documentService.upload(req.user.id, req.body.type, req.file);
    return created(res, data, 'Document uploaded');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await documentService.remove(req.user.id, req.params.id);
    return success(res, null, 'Document deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, upload, remove };
