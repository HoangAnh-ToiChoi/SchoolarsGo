/**
 * ProfileService — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Lớp này CHỨA BUSINESS LOGIC, KHÔNG có SQL.
 * SQL nằm trong ProfileRepository — Service chỉ gọi repo methods.
 *
 * Inject: profileRepo qua constructor
 *
 * Public methods — Controller gọi:
 *   getProfile(userId)     → { ...profile, documents }
 *   updateProfile(userId, updates) → profile đã upsert
 */

class ProfileService {
  constructor(profileRepository) {
    this.profileRepo = profileRepository;
  }

  // ─── PUBLIC — Controller gọi ─────────────────────────────────────────────

  getProfile = async (userId) => {
    return this.profileRepo.getProfile(userId);
  };

  updateProfile = async (userId, updates) => {
    // ─── Business Validation ───────────────────────────────────────────────
    if (updates.gpa !== undefined) {
      const gpa = parseFloat(updates.gpa);
      if (Number.isNaN(gpa)) {
        const err = new Error('GPA phải là số');
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
      }
      if (gpa < 0 || gpa > updates.gpa_scale || (updates.gpa_scale === undefined && gpa > 4.0)) {
        const err = new Error(`GPA phải nằm trong khoảng 0 - ${updates.gpa_scale || 4.0}`);
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
      }
    }

    if (updates.english_level !== undefined) {
      const validLevels = ['none', 'basic', 'intermediate', 'advanced', 'proficient'];
      if (!validLevels.includes(updates.english_level)) {
        const err = new Error(`english_level không hợp lệ. Giá trị được chấp nhận: ${validLevels.join(', ')}`);
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
      }
    }

    if (updates.target_degree !== undefined) {
      const validDegrees = ['Bachelor', 'Master', 'PhD', 'Any'];
      if (!validDegrees.includes(updates.target_degree)) {
        const err = new Error(`target_degree không hợp lệ. Giá trị được chấp nhận: ${validDegrees.join(', ')}`);
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
      }
    }

    return this.profileRepo.updateProfile(userId, updates);
  };
}

module.exports = ProfileService;
