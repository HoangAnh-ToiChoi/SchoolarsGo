import api from '~/utils/apiClient';

// Applications
export const applicationService = {
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.patch(`/applications/${id}`, data),
  remove: (id) => api.delete(`/applications/${id}`),
};
