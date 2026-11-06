import api from '~/lib/api-client';

// Chat
export const chatService = {
  send: (messages) => api.post('/chat', { messages }),
  getHistory: () => api.get('/chat/history'),
};
