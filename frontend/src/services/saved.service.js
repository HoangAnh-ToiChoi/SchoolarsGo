import api from '~/utils/apiClient';

// Saved Scholarships
export const savedService = {
  getAll: () => api.get('/saved'),
  save: (scholarshipId, note) => api.post(`/saved/${scholarshipId}`, { note }),
  remove: (scholarshipId) => api.delete(`/saved/${scholarshipId}`),
};
