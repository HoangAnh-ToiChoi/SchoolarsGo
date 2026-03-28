const savedService = require('../services/saved.service');
const { success, created } = require('../utils/responseHelper');

const getAll = async (req, res, next) => {
  try {
    const data = await savedService.getAll(req.user.id);
    return success(res, data);
  } catch (error) {
    next(error);
  }
};

const save = async (req, res, next) => {
  try {
    const data = await savedService.save(req.user.id, req.params.scholarshipId, req.body.note);
    return created(res, data, 'Scholarship saved');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await savedService.remove(req.user.id, req.params.scholarshipId);
    return success(res, null, 'Scholarship removed from saved');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, save, remove };
