import savedService from '~/services/saved.service.js';

class SavedController {
  async getAll(req, res) {
    const data = await savedService.getAll(req.user.id);
    return res.success(data);
  }

  async save(req, res) {
    const { scholarshipId } = req.params;
    const { note } = req.body;
    const data = await savedService.save(req.user.id, scholarshipId, note);
    return res.created(data, 'Scholarship saved successfully.');
  }

  async remove(req, res) {
    const { scholarshipId } = req.params;
    await savedService.remove(req.user.id, scholarshipId);
    return res.success(null, 'Scholarship removed from saved list.');
  }
}

export default new SavedController();