import api from '~/lib/apiClient';

// Chat
export const chatService = {
  send: (messages) => api.post('/chat', { messages }),
  getHistory: () => api.get('/chat/history'),
};
