/**
 * ProfileController — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Nhận req/res, gọi service từ container, trả về res.
 * TUYỆT ĐỐI không chứa business logic.
 *
 * Inject: profileService qua constructor
 */

class ProfileController {
  constructor(profileService) {
    this.profileService = profileService;
  }

  // ─── PUBLIC — Routes gọi ────────────────────────────────────────────────

  getProfile = (req, res, next) => {
    try {
      const data = this.profileService.getProfile(req.user.id);
      return data.then(d => {
        const { success } = require('../utils/responseHelper');
        return success(res, d);
      }).catch(next);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = (req, res, next) => {
    try {
      const data = this.profileService.updateProfile(req.user.id, req.body);
      return data.then(d => {
        const { success } = require('../utils/responseHelper');
        return success(res, d, 'Profile updated');
      }).catch(next);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ProfileController;
