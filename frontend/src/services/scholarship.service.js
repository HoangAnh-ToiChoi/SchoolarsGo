import api from '~/utils/apiClient';

// Scholarships
export const scholarshipService = {
  getAll: (params) => api.get('/scholarships', { params }),
  getById: (idOrSlug) => api.get(`/scholarships/${idOrSlug}`),
  getFeatured: () => api.get('/scholarships/featured'),
  getCountries: () => api.get('/scholarships/countries'),
};
