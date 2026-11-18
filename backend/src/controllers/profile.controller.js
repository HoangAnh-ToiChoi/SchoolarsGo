const { success } = require('../utils/responseHelper');
const ProfileService = require('../services/profile.service');

class ProfileController {
  #service;

  constructor(profileService = new ProfileService()) {
    this.#service = profileService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#service) throw new Error('ProfileService is required');
  }

  async getProfile(req, res, next) {
    try {
      const data = await this.#service.getProfile(req.user.id);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const data = await this.#service.updateProfile(req.user.id, req.body);
      return success(res, data, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfileController;
