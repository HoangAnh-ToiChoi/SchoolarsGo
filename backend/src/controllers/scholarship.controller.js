/**
 * ScholarshipController — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * HTTP handling, KHÔNG chứa business logic — chỉ nhận req/res, gọi service.
 * Inject: scholarshipService qua constructor.
 */
const { success } = require('../utils/responseHelper');

class ScholarshipController {
  constructor(scholarshipService) {
    this.scholarshipService = scholarshipService;
  }

  // ─── PUBLIC — routes gọi (arrow functions) ──────────────────────────────

  getAll = async (req, res, next) => {
    try {
      const { data, meta } = await this.scholarshipService.getAll(req.query, req.user?.id);
      return success(res, data, 'Scholarships retrieved', meta);
    } catch (error) {
      next(error);
    }
  };

  getFeatured = async (req, res, next) => {
    try {
      const data = await this.scholarshipService.getFeatured();
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };

  getCountries = async (req, res, next) => {
    try {
      const data = await this.scholarshipService.getCountries();
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const data = await this.scholarshipService.getById(req.params.id, req.user?.id);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ScholarshipController;
