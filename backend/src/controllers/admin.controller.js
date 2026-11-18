/**
 * AdminController — TẦNG 1: HTTP Handling
 *
 * Mục đích: Nhận request → Gọi Service → Trả Response.
 * KHÔNG chứa SQL. KHÔNG chứa logic nghiệp vụ.
 *
 * Tiêu chí OOP:
 * [1] Phân tách tầng — Controller chỉ nhận req, gọi service, trả res.
 * [4] Xử lý lỗi tập trung — try/catch chỉ gọi next(error), không tự trả response lỗi.
 * [6] Tính trừu tượng — Controller không biết Repository dùng SQL gì, thư viện gì.
 */
class AdminController {
  /**
   * @param {AdminService} adminService
   */
  constructor(adminService) {
    this.#validateService(adminService);
    this.#service = adminService;
  }

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD STATS
  // ═══════════════════════════════════════════════════════════

  async getStats(req, res, next) {
    try {
      const stats = await this.#service.fetchDashboardStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getChartStats(req, res, next) {
    try {
      const chartData = await this.#service.fetchDashboardChart();
      return res.status(200).json({ success: true, data: chartData });
    } catch (err) {
      next(err);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  async getUsers(req, res, next) {
    try {
      const { page, limit, role, search, status } = req.query;
      const result = await this.#service.paginateUsers({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        role,
        search,
        status,
      });
      return res.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await this.#service.getUserById(req.params.id);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { id: targetUserId } = req.params;
      const { role } = req.body;
      const adminId = req.user.id;
      const user = await this.#service.changeUserRole(targetUserId, role, adminId);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { id: targetUserId } = req.params;
      const { isActive } = req.body;
      const adminId = req.user.id;
      const user = await this.#service.changeUserStatus(targetUserId, isActive, adminId);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SCHOLARSHIP MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  async createScholarship(req, res, next) {
    try {
      const scholarship = await this.#service.addScholarship(req.body);
      return res.status(201).json({ success: true, data: scholarship });
    } catch (err) {
      next(err);
    }
  }

  async updateScholarship(req, res, next) {
    try {
      const scholarship = await this.#service.modifyScholarship(req.params.id, req.body);
      return res.status(200).json({ success: true, data: scholarship });
    } catch (err) {
      next(err);
    }
  }

  async updateScholarshipFeatured(req, res, next) {
    try {
      const { isFeatured } = req.body;
      const scholarship = await this.#service.toggleScholarshipFeatured(req.params.id, isFeatured);
      return res.status(200).json({ success: true, data: scholarship });
    } catch (err) {
      next(err);
    }
  }

  async deleteScholarship(req, res, next) {
    try {
      await this.#service.removeScholarship(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa học bổng' });
    } catch (err) {
      next(err);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE — Encapsulation (Tiêu chí 3)
  // ═══════════════════════════════════════════════════════════

  /**
   * @param {unknown} service
   */
  #validateService(service) {
    if (!service || typeof service !== 'object') {
      throw new Error('AdminController requires a valid AdminService instance');
    }
  }

  /** @type {AdminService} */
  #service;
}

module.exports = AdminController;
