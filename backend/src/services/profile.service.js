import { AppError, profile as profileErrors } from '~/constants/errors.js';
import { PROFILE_VALID_DEGREES, PROFILE_ENGLISH_LEVEL_MAX, PROFILE_DEFAULT_GPA_SCALE } from '~/constants/profile.js';
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
      if (Number.isNaN(gpa)) throw new AppError(profileErrors.GPA_NOT_NUMBER);
      const maxGpa = updates.gpa_scale || PROFILE_DEFAULT_GPA_SCALE;
      if (gpa < 0 || gpa > maxGpa)
        throw new AppError(profileErrors.gpaOutOfRange(maxGpa));
    }

    if (updates.english_level !== undefined) {
      if (String(updates.english_level).length > PROFILE_ENGLISH_LEVEL_MAX)
        throw new AppError(profileErrors.ENGLISH_LEVEL_TOO_LONG);
    }

    if (updates.target_degree !== undefined) {
      if (!PROFILE_VALID_DEGREES.includes(updates.target_degree))
        throw new AppError(profileErrors.INVALID_DEGREE);
    }
  }
}

export default new ProfileService();