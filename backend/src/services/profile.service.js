const AppError = require('../utils/AppError');

class ProfileService {
  #repo;

  constructor(profileRepository) {
    this.#repo = profileRepository;
  }

  getProfile = async userId => {
    return this.#repo.findByUserId(userId);
  };

  updateProfile = async (userId, updates) => {
    this.#validateUpdate(updates);
    return this.#repo.upsertProfile(userId, updates);
  };

  #validateUpdate(updates) {
    if (updates.gpa !== undefined) {
      const gpa = parseFloat(updates.gpa);
      if (Number.isNaN(gpa)) throw new AppError('GPA phải là số', 400, 'INVALID_GPA');
      const maxGpa = updates.gpa_scale || 4.0;
      if (gpa < 0 || gpa > maxGpa)
        throw new AppError(`GPA phải nằm trong khoảng 0 - ${maxGpa}`, 400, 'INVALID_GPA');
    }

    if (updates.english_level !== undefined) {
      if (String(updates.english_level).length > 50)
        throw new AppError('english_level không được vượt quá 50 ký tự', 400, 'INVALID_ENGLISH_LEVEL');
    }

    if (updates.target_degree !== undefined) {
      const validDegrees = ['Bachelor', 'Master', 'PhD', 'Any'];
      if (!validDegrees.includes(updates.target_degree))
        throw new AppError(
          `target_degree không hợp lệ. Giá trị được chấp nhận: ${validDegrees.join(', ')}`,
          400,
          'INVALID_DEGREE'
        );
    }
  }
}

module.exports = ProfileService;
