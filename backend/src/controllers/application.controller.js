const applicationService = require('../services/application.service');
const { success, created } = require('../utils/responseHelper');

const getAll = async (req, res, next) => {
  try {
    const { data, meta } = await applicationService.getAll(req.user.id, req.query);
    return success(res, data, 'Applications retrieved', meta);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await applicationService.create(req.user.id, req.body);
    return created(res, data, 'Application created');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await applicationService.getById(req.user.id, req.params.id);
    return success(res, data);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await applicationService.update(req.user.id, req.params.id, req.body);
    return success(res, data, 'Application updated');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await applicationService.remove(req.user.id, req.params.id);
    return success(res, null, 'Application deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, getById, update, remove };
