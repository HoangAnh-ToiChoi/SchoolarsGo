import api from '~/lib/apiClient';

// Documents
export const documentService = {
  getAll: () => api.get('/documents'),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id) => api.delete(`/documents/${id}`),
};
