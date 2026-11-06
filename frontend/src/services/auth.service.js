import api from '~/lib/apiClient';

// Auth
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgotPassword', { email }),
  resetPassword: (token, password) => api.post('/auth/resetPassword', { token, password }),
};
