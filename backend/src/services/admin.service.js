import AppError from '#utils/AppError.js';
import adminModel from '#models/admin.model.js';
import sessionService from './session.service.js';

class AdminService {
  async fetchDashboardStats() {
    const [
      totalUsers,
      newUsersThisWeek,
      totalScholarships,
      activeScholarships,
      totalApplications,
      applicationsByStatusRows,
    ] = await Promise.all([
      adminModel.countTotalUsers(),
      adminModel.countNewUsersThisWeek(),
      adminModel.countTotalScholarships(),
      adminModel.countActiveScholarships(),
      adminModel.countTotalApplications(),
      adminModel.countApplicationsByStatus(),
    ]);

    return {
      totalUsers,
      newUsersThisWeek,
      totalScholarships,
      activeScholarships,
      totalApplications,
      applicationsByStatus: this.#normalizeStatusCounts(applicationsByStatusRows),
    };
  }

  async fetchDashboardChart() {
    const [userRegistrationsByWeek, applicationsByStatus] = await Promise.all([
      adminModel.getUserRegistrationsByWeek(),
      adminModel.getApplicationsByStatusChart(),
    ]);

    return { userRegistrationsByWeek, applicationsByStatus };
  }

  async paginateUsers(filters) {
    const { users, total } = await adminModel.findUsers(filters);
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
  }

  async getUserById(userId) {
    const user = await adminModel.findUserById(userId);
    this.#guardFound(user, 'Không tìm thấy user', 404, 'USER_NOT_FOUND');
    return user;
  }

  async changeUserRole(targetUserId, newRole, adminId) {
    this.#guardSelfModification(targetUserId, adminId);
    this.#validateRole(newRole);

    const user = await adminModel.updateUserRole(targetUserId, newRole);
    this.#guardFound(
      user,
      'Không tìm thấy user hoặc user đã bị vô hiệu hóa',
      404,
      'USER_NOT_FOUND'
    );
    await sessionService?.endAllForUser(targetUserId, 'role_changed');
    return user;
  }

  async changeUserStatus(targetUserId, isActive, adminId) {
    this.#guardSelfModification(targetUserId, adminId);

    const user = await adminModel.updateUserStatus(targetUserId, isActive);
    this.#guardFound(user, 'Không tìm thấy user', 404, 'USER_NOT_FOUND');
    if (!isActive) await sessionService?.endAllForUser(targetUserId, 'locked');
    return user;
  }

  async addScholarship(data) {
    const scholarshipData = {
      ...data,
      is_active: data.is_active !== undefined ? data.is_active : true,
    };
    const scholarship = await adminModel.createScholarship(scholarshipData);
    this.#guardFound(scholarship, 'Không thể tạo học bổng', 500, 'CREATE_SCHOLARSHIP_FAILED');
    return scholarship;
  }

  async modifyScholarship(id, data) {
    const scholarship = await adminModel.updateScholarship(id, data);
    this.#guardFound(
      scholarship,
      'Không tìm thấy học bổng hoặc học bổng đã bị xóa',
      404,
      'SCHOLARSHIP_NOT_FOUND'
    );
    return scholarship;
  }

  async toggleScholarshipFeatured(id, isFeatured) {
    const scholarship = await adminModel.updateScholarshipFeatured(id, isFeatured);
    this.#guardFound(
      scholarship,
      'Không tìm thấy học bổng hoặc học bổng đã bị xóa',
      404,
      'SCHOLARSHIP_NOT_FOUND'
    );
    return scholarship;
  }

  async removeScholarship(id) {
    const scholarship = await adminModel.softDeleteScholarship(id);
    this.#guardFound(
      scholarship,
      'Không tìm thấy học bổng hoặc học bổng đã bị xóa',
      404,
      'SCHOLARSHIP_NOT_FOUND'
    );
    return { id: scholarship.id, title: scholarship.title };
  }

  #normalizeStatusCounts(rows) {
    const map = { saved: 0, in_progress: 0, submitted: 0, accepted: 0, rejected: 0 };
    rows.forEach(row => {
      if (row.status in map) map[row.status] = parseInt(row.count, 10);
    });
    return map;
  }

  /** Admin không được tự đổi quyền hoặc khóa chính mình. */
  #guardSelfModification(targetUserId, adminId) {
    if (targetUserId === adminId) {
      throw AppError.badRequest(
        'Không thể tự thay đổi quyền hoặc vô hiệu hóa chính mình',
        'SELF_MODIFICATION_FORBIDDEN'
      );
    }
  }

  #validateRole(role) {
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      throw AppError.badRequest(
        'Role không hợp lệ. Chỉ chấp nhận "user" hoặc "admin"',
        'INVALID_ROLE'
      );
    }
  }

  #guardFound(entity, message, statusCode, code) {
    if (!entity) {
      throw new AppError(message, statusCode, code);
    }
  }
}

export default new AdminService();