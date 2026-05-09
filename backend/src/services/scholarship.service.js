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

const PAGE_SIZE = 20;
const MAX_LIMIT = 50;

class ScholarshipService {
  constructor(scholarshipRepository) {
    this.repo = scholarshipRepository;
  }

  // ─── PUBLIC — Controller gọi ─────────────────────────────────────────────

  /**
   * Lấy danh sách học bổng có filter + pagination
   * Business logic phân trang nằm ở đây, Repository chỉ nhận limit/offset.
   */
  getAll = async (filters = {}, userId = null) => {
    // ── Tính toán phân trang (business logic) ──
    const page  = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || PAGE_SIZE));
    const offset = (page - 1) * limit;

    // ── Gọi Repository với limit & offset đã tính ──
    const { data, total } = await this.repo.findAll(filters, limit, offset, userId);

    // ── Ghép meta phân trang ──
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { page, limit, total, totalPages },
    };
  };

  getFeatured = async () => {
    return this.repo.findFeatured();
  };

  getCountries = async () => {
    return this.repo.findCountries();
  };

  getById = async (id, userId = null) => {
    const scholarship = await this.repo.findById(id, userId);
    this.#ensureFound(scholarship, id);
    return scholarship;
  };

  // ─── PRIVATE — chỉ dùng nội bộ ──────────────────────────────────────────

  #ensureFound(scholarship, id) {
    if (!scholarship) {
      const err = new Error('Không tìm thấy học bổng');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }
  }
}

module.exports = ScholarshipService;
