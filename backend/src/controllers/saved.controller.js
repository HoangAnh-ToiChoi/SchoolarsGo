/**
 * SavedScholarshipController — Bước 4: Refactor Saved Scholarships (Tầng Controller)
 *
 * HTTP handling, KHÔNG chứa business logic — chỉ nhận req/res, gọi service.
 * Inject: savedService qua constructor.
 */

const { success, created } = require('../utils/responseHelper');

class SavedScholarshipController {
  constructor(savedService) {
    this.savedService = savedService;
  }

  // ─── PUBLIC — routes gọi (arrow functions để giữ `this`) ───────────────────

  getAll = async (req, res, next) => {
    try {
      const data = await this.savedService.getAll(req.user.id);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };

  save = async (req, res, next) => {
    try {
      const data = await this.savedService.save(
        req.user.id,
        req.params.scholarshipId,
        req.body.note
      );
      return created(res, data, 'Scholarship saved');
    } catch (error) {
      next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      await this.savedService.remove(req.user.id, req.params.scholarshipId);
      return success(res, null, 'Scholarship removed from saved');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = SavedScholarshipController;
