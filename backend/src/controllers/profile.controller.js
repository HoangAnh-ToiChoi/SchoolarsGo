const profileService = require('../services/profile.service');
const { success } = require('../utils/responseHelper');

const getProfile = async (req, res, next) => {
  try {
    const data = await profileService.getProfile(req.user.id);
    return success(res, data);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await profileService.updateProfile(req.user.id, req.body);
    return success(res, data, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
