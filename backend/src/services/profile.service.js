/**
 * ProfileService — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Lớp này CHỨA BUSINESS LOGIC, KHÔNG có SQL.
 * SQL nằm trong ProfileRepository — Service chỉ gọi repo methods.
 *
 * Inject: profileRepo qua constructor
 *
 * Public methods — Controller gọi:
 *   getProfile(userId)    → profile object kèm documents
 *   updateProfile(userId, updates) → profile đã upsert
 */
class ProfileService {
  constructor(profileRepository) {
    this.repo = profileRepository;
  }

  // ─── PUBLIC — Controller gọi ─────────────────────────────────────────────

  getProfile = async (userId) => {
    return this.repo.findByUserId(userId);
  };

  updateProfile = async (userId, updates) => {
    this.#validateUpdate(updates);
    return this.repo.upsertProfile(userId, updates);
  };

  // ─── PRIVATE — business validation ────────────────────────────────────────

  #throwError(message, statusCode = 500) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isOperational = true;
    throw err;
  }

  #validateUpdate(updates) {
    if (updates.gpa !== undefined) {
      const gpa = parseFloat(updates.gpa);
      if (Number.isNaN(gpa)) {
        this.#throwError('GPA phải là số', 400);
      }
      const maxGpa = updates.gpa_scale || 4.0;
      if (gpa < 0 || gpa > maxGpa) {
        this.#throwError(`GPA phải nằm trong khoảng 0 - ${maxGpa}`, 400);
      }
    }

    if (updates.english_level !== undefined) {
      const validLevels = ['none', 'basic', 'intermediate', 'advanced', 'proficient'];
      if (!validLevels.includes(updates.english_level)) {
        this.#throwError(`english_level không hợp lệ. Giá trị được chấp nhận: ${validLevels.join(', ')}`, 400);
      }
    }

    if (updates.target_degree !== undefined) {
      const validDegrees = ['Bachelor', 'Master', 'PhD', 'Any'];
      if (!validDegrees.includes(updates.target_degree)) {
        this.#throwError(`target_degree không hợp lệ. Giá trị được chấp nhận: ${validDegrees.join(', ')}`, 400);
      }
    }
  }
}

module.exports = ProfileService;
