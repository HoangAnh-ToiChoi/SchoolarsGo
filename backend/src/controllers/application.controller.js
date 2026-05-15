const { success, created } = require('../utils/responseHelper');

class ApplicationController {
  #service;

  constructor(applicationService) {
    this.#service = applicationService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#service) throw new Error('ApplicationService is required');
  }

  getAll = async (req, res, next) => {
    try {
      const { data, meta } = await this.#service.getAll(req.user.id, req.query);
      return success(res, data, 'OK', meta);
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const { scholarship_id, checklist, notes } = req.body;
      const data = await this.#service.create(req.user.id, {
        scholarshipId: scholarship_id,
        checklist,
        notes,
      });
      return created(res, data, 'Đơn ứng tuyển đã được tạo thành công.');
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const data = await this.#service.getById(req.user.id, req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const data = await this.#service.update(req.user.id, req.params.id, req.body);
      return success(res, data, 'Cập nhật đơn ứng tuyển thành công.');
    } catch (err) {
      next(err);
    }
  };

  remove = async (req, res, next) => {
    try {
      await this.#service.delete(req.user.id, req.params.id);
      return success(res, null, 'Đơn ứng tuyển đã được xóa thành công.');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = ApplicationController;
