import api from '~/utils/apiClient';

// Scholarships
export const scholarshipService = {
  getAll: (params) => api.get('/scholarships', { params }),
  getById: (id) => api.get(`/scholarships/${id}`),
  getFeatured: () => api.get('/scholarships/featured'),
  getCountries: () => api.get('/scholarships/countries'),
};
