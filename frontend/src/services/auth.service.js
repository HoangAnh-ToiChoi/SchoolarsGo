import api from '~/utils/apiClient';

// Auth
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  getAccount: () => api.get('/auth/account'),
  getSessions: () => api.get('/auth/sessions'),
  endSession: (id) => api.delete(`/auth/sessions/${id}`),
  forgotPassword: (email) => api.post('/auth/forgotPassword', { email }),
  resetPassword: (token, password) => api.post('/auth/resetPassword', { token, password }),
};
