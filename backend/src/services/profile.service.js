import AppError from '~/utils/AppError.js';
import profileModel from '~/models/profile.model.js';

class ProfileService {
  async getProfile(userId) {
    return profileModel.findByUserId(userId);
  }

  async updateProfile(userId, updates) {
    this.#validateUpdate(updates);
    return profileModel.upsertProfile(userId, updates);
  }

  #validateUpdate(updates) {
    if (updates.gpa !== undefined) {
      const gpa = parseFloat(updates.gpa);
      if (Number.isNaN(gpa)) throw AppError.badRequest('GPA phải là số', 'INVALID_GPA');
      const maxGpa = updates.gpa_scale || 4.0;
      if (gpa < 0 || gpa > maxGpa)
        throw AppError.badRequest(`GPA phải nằm trong khoảng 0 - ${maxGpa}`, 'INVALID_GPA');
    }

    if (updates.english_level !== undefined) {
      if (String(updates.english_level).length > 50)
        throw AppError.badRequest('english_level không được vượt quá 50 ký tự', 'INVALID_ENGLISH_LEVEL');
    }

    if (updates.target_degree !== undefined) {
      const validDegrees = ['Bachelor', 'Master', 'PhD', 'Any'];
      if (!validDegrees.includes(updates.target_degree))
        throw AppError.badRequest(
          `target_degree không hợp lệ. Giá trị được chấp nhận: ${validDegrees.join(', ')}`,
          'INVALID_DEGREE'
        );
    }
  }
}

export default new ProfileService();