import api from './api';

const adminService = {
  // Dashboard
  getStats: () => api.get('/admin/stats'),
  getChartStats: () => api.get('/admin/stats/chart'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),

  // Scholarships
  createScholarship: (data) => api.post('/admin/scholarships', data),
  updateScholarship: (id, data) => api.patch(`/admin/scholarships/${id}`, data),
  toggleFeatured: (id, isFeatured) => api.patch(`/admin/scholarships/${id}/featured`, { isFeatured }),
  deleteScholarship: (id) => api.delete(`/admin/scholarships/${id}`),
};

export default adminService;
