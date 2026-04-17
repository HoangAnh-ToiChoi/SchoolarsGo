const scholarshipService = require('../services/scholarship.service');
const { success } = require('../utils/responseHelper');

const getAll = async (req, res, next) => {
  try {
    const { data, meta } = await scholarshipService.getAll(req.query, req.user?.id);
    return success(res, data, 'Scholarships retrieved', meta);
  } catch (error) {
    next(error);
  }
};

const getFeatured = async (req, res, next) => {
  try {
    const data = await scholarshipService.getFeatured();
    return success(res, data);
  } catch (error) {
    next(error);
  }
};

const getCountries = async (req, res, next) => {
  try {
    const data = await scholarshipService.getCountries();
    return success(res, data);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await scholarshipService.getById(req.params.id, req.user?.id);
    return success(res, data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getFeatured, getCountries, getById };
