/**
 * ScholarshipService — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Lớp này CHỨA BUSINESS LOGIC, KHÔNG có SQL.
 * SQL nằm trong ScholarshipRepository — Service chỉ gọi repo methods.
 *
 * Inject: scholarshipRepo qua constructor
 *
 * Public methods — Controller gọi:
 *   getAll(filters, userId)     → { data, meta }
 *   getFeatured()                → rows[]
 *   getCountries()               → string[]
 *   getById(id, userId)          → scholarship object (throw 404 nếu không có)
 */
class ScholarshipService {
  constructor(scholarshipRepository) {
    this.repo = scholarshipRepository;
  }

  // ─── PUBLIC — Controller gọi ─────────────────────────────────────────────

  getAll = async (filters = {}, userId = null) => {
    return this.repo.findAll(filters, userId);
  };

  getFeatured = async () => {
    return this.repo.findFeatured();
  };

  getCountries = async () => {
    return this.repo.findCountries();
  };

  getById = async (id, userId = null) => {
    const scholarship = await this.repo.findById(id, userId);
    this.#ensureFound(scholarship);
    return scholarship;
  };

  // ─── PRIVATE — chỉ dùng nội bộ ──────────────────────────────────────────

  #throwError(message, statusCode = 500) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isOperational = true;
    throw err;
  }

  #ensureFound(scholarship, message = 'Không tìm thấy') {
    if (!scholarship) this.#throwError(message, 404);
  }
}

module.exports = ScholarshipService;
