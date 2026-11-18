import { success } from '~/utils/responseHelper.js';
import scholarshipService from '~/services/scholarship.service.js';

class ScholarshipController {
  async getAll(req, res) {
    const { data, meta } = await scholarshipService.getAll(req.query, req.user?.id);
    return success(res, data, 'Scholarships retrieved', meta);
  }

  async getFeatured(req, res) {
    const data = await scholarshipService.getFeatured();
    return success(res, data);
  }

  async getCountries(req, res) {
    const data = await scholarshipService.getCountries();
    return success(res, data);
  }

  async getById(req, res) {
    const data = await scholarshipService.getById(req.params.id, req.user?.id);
    return success(res, data);
  }
}

export default new ScholarshipController();