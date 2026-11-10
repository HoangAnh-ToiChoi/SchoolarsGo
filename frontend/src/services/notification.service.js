import api from '~/utils/apiClient';

// Notifications (chuông trên header)
export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/readAll'),
};
