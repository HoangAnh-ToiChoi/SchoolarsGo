import profileService from '~/services/profile.service.js';
import cvExtractService from '~/services/cvExtract.service.js';

class ProfileController {
  async getProfile(req, res) {
    const data = await profileService.getProfile(req.user.id);
    return res.success(data);
  }

  async parseCv(req, res) {
    const draft = await cvExtractService.extract(req.file);
    return res.success(draft, 'Đã đọc CV, vui lòng xác nhận trước khi lưu');
  }

  async updateProfile(req, res) {
    const data = await profileService.updateProfile(req.user.id, req.body);
    return res.success(data, 'Profile updated');
  }
}

export default new ProfileController();