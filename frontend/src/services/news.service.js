import api from '~/lib/apiClient';

export const fetchNews = (params = {}) =>
  api.get('/news', { params }).then((r) => r.data);
