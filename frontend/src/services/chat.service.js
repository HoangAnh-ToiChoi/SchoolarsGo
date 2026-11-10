import api from '~/utils/apiClient';

// Chat
export const chatService = {
  send: (messages) => api.post('/chat', { messages }),
  getHistory: () => api.get('/chat/history'),
};
