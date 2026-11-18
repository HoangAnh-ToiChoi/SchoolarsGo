import { success, created } from '#utils/responseHelper.js';
import applicationService from '#services/application.service.js';

class ApplicationController {
  async getAll(req, res) {
    const { data, meta } = await applicationService.getAll(req.user.id, req.query);
    return success(res, data, 'OK', meta);
  }

  async create(req, res) {
    const { scholarship_id, checklist, notes } = req.body;
    const data = await applicationService.create(req.user.id, {
      scholarshipId: scholarship_id,
      checklist,
      notes,
    });
    return created(res, data, 'Đơn ứng tuyển đã được tạo thành công.');
  }

  async getById(req, res) {
    const data = await applicationService.getById(req.user.id, req.params.id);
    return success(res, data);
  }

  async update(req, res) {
    const data = await applicationService.update(req.user.id, req.params.id, req.body);
    return success(res, data, 'Cập nhật đơn ứng tuyển thành công.');
  }

  async remove(req, res) {
    await applicationService.delete(req.user.id, req.params.id);
    return success(res, null, 'Đơn ứng tuyển đã được xóa thành công.');
  }
}

export default new ApplicationController();