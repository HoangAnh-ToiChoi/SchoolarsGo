const { success, created } = require('../utils/responseHelper');

class SavedController {
  #service;

  constructor(savedService) {
    this.#service = savedService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#service) throw new Error('SavedService is required');
  }

  getAll = async (req, res, next) => {
    try {
      const data = await this.#service.getAll(req.user.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  };

  save = async (req, res, next) => {
    try {
      const { scholarshipId } = req.params;
      const { note } = req.body;
      const data = await this.#service.save(req.user.id, scholarshipId, note);
      return created(res, data, 'Scholarship saved successfully.');
    } catch (err) {
      next(err);
    }
  };

  remove = async (req, res, next) => {
    try {
      const { scholarshipId } = req.params;
      await this.#service.remove(req.user.id, scholarshipId);
      return success(res, null, 'Scholarship removed from saved list.');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = SavedController;
