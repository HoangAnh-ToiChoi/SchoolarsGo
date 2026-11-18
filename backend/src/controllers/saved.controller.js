import { success, created } from '#utils/responseHelper.js';
import savedService from '#services/saved.service.js';

class SavedController {
  async getAll(req, res) {
    const data = await savedService.getAll(req.user.id);
    return success(res, data);
  }

  async save(req, res) {
    const { scholarshipId } = req.params;
    const { note } = req.body;
    const data = await savedService.save(req.user.id, scholarshipId, note);
    return created(res, data, 'Scholarship saved successfully.');
  }

  async remove(req, res) {
    const { scholarshipId } = req.params;
    await savedService.remove(req.user.id, scholarshipId);
    return success(res, null, 'Scholarship removed from saved list.');
  }
}

export default new SavedController();