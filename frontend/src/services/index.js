import api from './api';

// Auth
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Scholarships
export const scholarshipService = {
  getAll: (params) => api.get('/scholarships', { params }),
  getById: (id) => api.get(`/scholarships/${id}`),
  getFeatured: () => api.get('/scholarships/featured'),
  getCountries: () => api.get('/scholarships/countries'),
};

// Profile
export const profileService = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
};

// Documents
export const documentService = {
  getAll: () => api.get('/documents'),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id) => api.delete(`/documents/${id}`),
};

// Applications
export const applicationService = {
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.patch(`/applications/${id}`, data),
  remove: (id) => api.delete(`/applications/${id}`),
};

// Saved Scholarships
export const savedService = {
  getAll: () => api.get('/saved'),
  save: (scholarshipId, note) => api.post(`/saved/${scholarshipId}`, { note }),
  remove: (scholarshipId) => api.delete(`/saved/${scholarshipId}`),
};

// AI Recommender
export const recommendService = {
  recommend: (topN) => api.post('/recommend', { top_n: topN }),
};
