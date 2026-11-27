import { AppError, admin as adminErrors } from '~/constants/errors.js';
import { ADMIN_VALID_ROLES } from '~/constants/admin.js';
import { APPLICATION_STATUSES } from '~/constants/application.js';
import adminModel from '~/models/admin.model.js';
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
    this.#guardFound(user, adminErrors.USER_NOT_FOUND);
    return user;
  }

  async changeUserRole(targetUserId, newRole, adminId) {
    this.#guardSelfModification(targetUserId, adminId);
    this.#validateRole(newRole);

    const user = await adminModel.updateUserRole(targetUserId, newRole);
    this.#guardFound(user, adminErrors.USER_NOT_FOUND_OR_DISABLED);
    await sessionService?.endAllForUser(targetUserId, 'role_changed');
    return user;
  }

  async changeUserStatus(targetUserId, isActive, adminId) {
    this.#guardSelfModification(targetUserId, adminId);

    const user = await adminModel.updateUserStatus(targetUserId, isActive);
    this.#guardFound(user, adminErrors.USER_NOT_FOUND);
    if (!isActive) await sessionService?.endAllForUser(targetUserId, 'locked');
    return user;
  }

  async addScholarship(data) {
    const scholarshipData = {
      ...data,
      is_active: data.is_active !== undefined ? data.is_active : true,
    };
    const scholarship = await adminModel.createScholarship(scholarshipData);
    this.#guardFound(scholarship, adminErrors.CREATE_SCHOLARSHIP_FAILED);
    return scholarship;
  }

  async modifyScholarship(id, data) {
    const scholarship = await adminModel.updateScholarship(id, data);
    this.#guardFound(scholarship, adminErrors.SCHOLARSHIP_NOT_FOUND_OR_DELETED);
    return scholarship;
  }

  async toggleScholarshipFeatured(id, isFeatured) {
    const scholarship = await adminModel.updateScholarshipFeatured(id, isFeatured);
    this.#guardFound(scholarship, adminErrors.SCHOLARSHIP_NOT_FOUND_OR_DELETED);
    return scholarship;
  }

  async removeScholarship(id) {
    const scholarship = await adminModel.softDeleteScholarship(id);
    this.#guardFound(scholarship, adminErrors.SCHOLARSHIP_NOT_FOUND_OR_DELETED);
    return { id: scholarship.id, title: scholarship.title };
  }

  // Trước đây đếm theo bộ trạng thái cũ (saved, in_progress…) nên draft / under_review / interview luôn mất
  #normalizeStatusCounts(rows) {
    const map = Object.fromEntries(APPLICATION_STATUSES.map(status => [status, 0]));
    rows.forEach(row => {
      if (row.status in map) map[row.status] = parseInt(row.count, 10);
    });
    return map;
  }

  /** Admin không được tự đổi quyền hoặc khóa chính mình. */
  #guardSelfModification(targetUserId, adminId) {
    if (targetUserId === adminId) {
      throw new AppError(adminErrors.SELF_MODIFICATION_FORBIDDEN);
    }
  }

  #validateRole(role) {
    if (!ADMIN_VALID_ROLES.includes(role)) {
      throw new AppError(adminErrors.INVALID_ROLE);
    }
  }

  #guardFound(entity, errorDefinition) {
    if (!entity) {
      throw new AppError(errorDefinition);
    }
  }
}

export default new AdminService();