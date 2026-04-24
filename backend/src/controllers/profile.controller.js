/**
 * ProfileController — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * HTTP handling, KHÔNG chứa business logic — chỉ nhận req/res, gọi service.
 * Inject: profileService qua constructor.
 */

const { success } = require('../utils/responseHelper');

class ProfileController {
  constructor(profileService) {
    this.profileService = profileService;
  }

  // ─── PUBLIC — routes gọi (arrow functions) ──────────────────────────────

  getProfile = async (req, res, next) => {
    try {
      const data = await this.profileService.getProfile(req.user.id);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req, res, next) => {
    try {
      const data = await this.profileService.updateProfile(req.user.id, req.body);
      return success(res, data, 'Profile updated');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ProfileController;
