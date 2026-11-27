import adminService from '~/services/admin.service.js';

class AdminController {
  async getStats(req, res) {
    const stats = await adminService.fetchDashboardStats();
    return res.success(stats);
  }

  async getChartStats(req, res) {
    const chartData = await adminService.fetchDashboardChart();
    return res.success(chartData);
  }

  async getUsers(req, res) {
    const { page, limit, role, search, status } = req.query;
    const result = await adminService.paginateUsers({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      role,
      search,
      status,
    });
    return res.success(result.data, 'OK', result.meta);
  }

  async getUserById(req, res) {
    const user = await adminService.getUserById(req.params.id);
    return res.success(user);
  }

  async updateUserRole(req, res) {
    const { id: targetUserId } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;
    const user = await adminService.changeUserRole(targetUserId, role, adminId);
    return res.success(user);
  }

  async updateUserStatus(req, res) {
    const { id: targetUserId } = req.params;
    const { isActive } = req.body;
    const adminId = req.user.id;
    const user = await adminService.changeUserStatus(targetUserId, isActive, adminId);
    return res.success(user);
  }

  async createScholarship(req, res) {
    const scholarship = await adminService.addScholarship(req.body);
    return res.created(scholarship, 'Đã tạo học bổng');
  }

  async updateScholarship(req, res) {
    const scholarship = await adminService.modifyScholarship(req.params.id, req.body);
    return res.success(scholarship);
  }

  async updateScholarshipFeatured(req, res) {
    const { isFeatured } = req.body;
    const scholarship = await adminService.toggleScholarshipFeatured(req.params.id, isFeatured);
    return res.success(scholarship);
  }

  async deleteScholarship(req, res) {
    await adminService.removeScholarship(req.params.id);
    return res.success(null, 'Đã xóa học bổng');
  }
}

export default new AdminController();