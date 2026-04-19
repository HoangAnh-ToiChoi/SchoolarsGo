/**
 * ScholarshipController — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * HTTP handling, import service từ container.
 * KHÔNG chứa business logic — chỉ nhận req/res, gọi service.
 *
 * Export: instance của class (để routes gọi trực tiếp)
 */
const { scholarshipService } = require('../container');
const { success } = require('../utils/responseHelper');

class ScholarshipController {
  // ─── PUBLIC — routes gọi trực tiếp (arrow functions) ──────────────────

  getAll = async (req, res, next) => {
    try {
      const { data, meta } = await scholarshipService.getAll(req.query, req.user?.id);
      return success(res, data, 'Scholarships retrieved', meta);
    } catch (error) {
      next(error);
    }
  };

  getFeatured = async (req, res, next) => {
    try {
      const data = await scholarshipService.getFeatured();
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };

  getCountries = async (req, res, next) => {
    try {
      const data = await scholarshipService.getCountries();
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const data = await scholarshipService.getById(req.params.id, req.user?.id);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ScholarshipController();
