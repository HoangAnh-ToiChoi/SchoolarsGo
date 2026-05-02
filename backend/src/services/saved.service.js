/**
 * SavedScholarshipService — Bước 4: Refactor Saved Scholarships (Tầng Service)
 *
 * Lớp này CHỨA BUSINESS LOGIC, KHÔNG có SQL.
 * SQL nằm trong SavedScholarshipRepository — Service chỉ gọi repo methods.
 *
 * Inject: savedScholarshipRepo qua constructor
 *
 * Public methods — Controller gọi:
 *   getAll(userId)                              → saved scholarships[]
 *   save(userId, scholarshipId, note)          → saved scholarship + details
 *   remove(userId, scholarshipId)               → void
 */
class SavedScholarshipService {
  constructor(savedScholarshipRepository) {
    this.repo = savedScholarshipRepository;
  }

  // ─── PUBLIC — Controller gọi ─────────────────────────────────────────────

  getAll = async (userId) => {
    const rows = await this.repo.findAllByUser(userId);
    return rows;
  };

  save = async (userId, scholarshipId, note) => {
    // Bước 1: Kiểm tra scholarship có tồn tại không
    const scholarship = await this.repo.findScholarshipById(scholarshipId);
    if (!scholarship) {
      this.#throwError('Không tìm thấy học bổng', 404);
    }

    // Bước 2: Kiểm tra đã save chưa (tránh duplicate)
    const existing = await this.repo.findExisting(userId, scholarshipId);
    if (existing) {
      this.#throwError(`Bạn đã lưu học bổng "${scholarship.title}" rồi`, 409);
    }

    // Bước 3: Tạo saved scholarship record
    const saved = await this.repo.create(userId, scholarshipId, note || null);

    // Bước 4: Lấy chi tiết scholarship để trả về client
    const scholarshipDetails = await this.repo.getScholarshipDetails(scholarshipId);

    return { ...saved, scholarship: scholarshipDetails };
  };

  remove = async (userId, scholarshipId) => {
    // Bước 1: Kiểm tra có trong danh sách đã lưu không
    const existing = await this.repo.findExisting(userId, scholarshipId);
    if (!existing) {
      this.#throwError('Không tìm thấy scholarship trong danh sách đã lưu', 404);
    }

    // Bước 2: Xóa khỏi DB
    await this.repo.deleteByUserAndScholarship(userId, scholarshipId);
  };

  // ─── PRIVATE — validation & error helpers ─────────────────────────────────

  #throwError(message, statusCode = 500) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isOperational = true;
    throw err;
  }
}

module.exports = SavedScholarshipService;
