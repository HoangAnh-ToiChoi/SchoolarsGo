/**
 * AdminService — TẦNG 2: Business Logic
 *
 * Mục đích: Xử lý nghiệp vụ, KHÔNG chứa SQL, KHÔNG chứa HTTP.
 *
 * Tiêu chí OOP:
 * [1] Phân tách tầng — toàn bộ DB access qua Repository.
 * [3] Encapsulation — logic nội bộ dùng prefix # (private methods).
 * [4] Xử lý lỗi — dùng AppError, không try/catch trong service.
 * [6] Abstraction — service gọi repo không biết bên dưới dùng SQL hay thư viện gì.
 * [7] Tell, Don't Ask — không lôi data lên check rồi mới lưu. Ra lệnh xử lý.
 */
const AppError = require('../utils/AppError');
class AdminService {
  /**
   * @param {AdminRepository} adminRepository
   */
  constructor(adminRepository) {
    this.#repo = adminRepository;
  }

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD STATS — Commands
  // ═══════════════════════════════════════════════════════════

  fetchDashboardStats = async () => {
    const [
      totalUsers,
      newUsersThisWeek,
      totalScholarships,
      activeScholarships,
      totalApplications,
      applicationsByStatusRows,
    ] = await Promise.all([
      this.#repo.countTotalUsers(),
      this.#repo.countNewUsersThisWeek(),
      this.#repo.countTotalScholarships(),
      this.#repo.countActiveScholarships(),
      this.#repo.countTotalApplications(),
      this.#repo.countApplicationsByStatus(),
    ]);

    return {
      totalUsers,
      newUsersThisWeek,
      totalScholarships,
      activeScholarships,
      totalApplications,
      applicationsByStatus: this.#normalizeStatusCounts(applicationsByStatusRows),
    };
  };

  fetchDashboardChart = async () => {
    const [userRegistrationsByWeek, applicationsByStatus] = await Promise.all([
      this.#repo.getUserRegistrationsByWeek(),
      this.#repo.getApplicationsByStatusChart(),
    ]);

    return { userRegistrationsByWeek, applicationsByStatus };
  };

  // ═══════════════════════════════════════════════════════════
  // USER MANAGEMENT — Commands
  // ═══════════════════════════════════════════════════════════

  paginateUsers = async filters => {
    const { users, total } = await this.#repo.findUsers(filters);
    const { page = 1, limit = 20 } = filters;
    return {
      data: users,
      meta: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  getUserById = async userId => {
    const user = await this.#repo.findUserById(userId);
    this.#guardFound(user, 'Không tìm thấy user', 404, 'USER_NOT_FOUND');
    return user;
  };

  /**
   * Thay đổi role của user.
   * Tiêu chí 7: Ra lệnh xử lý, KHÔNG query lên check trước.
   *
   * @param {string} targetUserId - UUID string
   * @param {string} newRole
   * @param {string} adminId - UUID string
   */
  changeUserRole = async (targetUserId, newRole, adminId) => {
    this.#guardSelfModification(targetUserId, adminId);
    this.#validateRole(newRole);

    const user = await this.#repo.updateUserRole(targetUserId, newRole);
    this.#guardFound(
      user,
      'Không tìm thấy user hoặc user đã bị vô hiệu hóa',
      404,
      'USER_NOT_FOUND'
    );
    return user;
  };

  // ═══════════════════════════════════════════════════════════
  // SCHOLARSHIP MANAGEMENT — Commands
  // ═══════════════════════════════════════════════════════════

  addScholarship = async data => {
    const scholarshipData = {
      ...data,
      is_active: data.is_active !== undefined ? data.is_active : true,
    };
    const scholarship = await this.#repo.createScholarship(scholarshipData);
    this.#guardFound(scholarship, 'Không thể tạo học bổng', 500, 'CREATE_SCHOLARSHIP_FAILED');
    return scholarship;
  };

  modifyScholarship = async (id, data) => {
    const scholarship = await this.#repo.updateScholarship(id, data);
    this.#guardFound(
      scholarship,
      'Không tìm thấy học bổng hoặc học bổng đã bị xóa',
      404,
      'SCHOLARSHIP_NOT_FOUND'
    );
    return scholarship;
  };

  toggleScholarshipFeatured = async (id, isFeatured) => {
    const scholarship = await this.#repo.updateScholarshipFeatured(id, isFeatured);
    this.#guardFound(
      scholarship,
      'Không tìm thấy học bổng hoặc học bổng đã bị xóa',
      404,
      'SCHOLARSHIP_NOT_FOUND'
    );
    return scholarship;
  };

  removeScholarship = async id => {
    const scholarship = await this.#repo.softDeleteScholarship(id);
    this.#guardFound(
      scholarship,
      'Không tìm thấy học bổng hoặc học bổng đã bị xóa',
      404,
      'SCHOLARSHIP_NOT_FOUND'
    );
    return { id: scholarship.id, title: scholarship.title };
  };

  // ═══════════════════════════════════════════════════════════
  // PRIVATE — Encapsulation (Tiêu chí 3)
  // ═══════════════════════════════════════════════════════════

  /**
   * Chuẩn hóa mảng status count thành object.
   * @param {Array<{status: string, count: string}>} rows
   * @returns {object}
   */
  #normalizeStatusCounts(rows) {
    const map = { saved: 0, in_progress: 0, submitted: 0, accepted: 0, rejected: 0 };
    rows.forEach(row => {
      if (row.status in map) map[row.status] = parseInt(row.count, 10);
    });
    return map;
  }

  /**
   * Tiêu chí 7: Ra lệnh — không query lên kiểm tra trước.
   * Chỉ so sánh 2 UUID string từ payload, throw ngay nếu trùng.
   *
   * @param {string} targetUserId
   * @param {string} adminId
   */
  #guardSelfModification(targetUserId, adminId) {
    if (targetUserId === adminId) {
      throw new AppError(
        'Không thể tự thay đổi quyền hoặc vô hiệu hóa chính mình',
        400,
        'SELF_MODIFICATION_FORBIDDEN'
      );
    }
  }

  /**
   * Kiểm tra role có hợp lệ không.
   * @param {string} role
   */
  #validateRole(role) {
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      throw new AppError(
        'Role không hợp lệ. Chỉ chấp nhận "user" hoặc "admin"',
        400,
        'INVALID_ROLE'
      );
    }
  }

  /**
   * Wrapper check null/undefined — throw AppError nếu không tìm thấy.
   * Tiêu chí 4: Lỗi nghiệp vụ dùng AppError.
   *
   * @param {unknown} entity
   * @param {string} message
   * @param {number} statusCode
   * @param {string} code
   */
  #guardFound(entity, message, statusCode, code) {
    if (!entity) {
      throw new AppError(message, statusCode, code);
    }
  }

  /** @type {AdminRepository} */
  #repo;
}

module.exports = AdminService;
