import { success } from '#utils/responseHelper.js';
import profileService from '#services/profile.service.js';

class ProfileController {
  async getProfile(req, res) {
    const data = await profileService.getProfile(req.user.id);
    return success(res, data);
  }

  async updateProfile(req, res) {
    const data = await profileService.updateProfile(req.user.id, req.body);
    return success(res, data, 'Profile updated');
  }
}

export default new ProfileController();