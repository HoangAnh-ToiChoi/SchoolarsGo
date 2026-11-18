const { success } = require('../utils/responseHelper');

class ScholarshipController {
  #service;

  constructor(scholarshipService) {
    this.#service = scholarshipService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#service) throw new Error('ScholarshipService is required');
  }

  async getAll(req, res, next) {
    try {
      const { data, meta } = await this.#service.getAll(req.query, req.user?.id);
      return success(res, data, 'Scholarships retrieved', meta);
    } catch (error) {
      next(error);
    }
  }

  async getFeatured(req, res, next) {
    try {
      const data = await this.#service.getFeatured();
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getCountries(req, res, next) {
    try {
      const data = await this.#service.getCountries();
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await this.#service.getById(req.params.id, req.user?.id);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScholarshipController;
