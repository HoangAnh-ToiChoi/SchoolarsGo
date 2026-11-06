import api from '~/lib/api-client';

export const fetchNews = (params = {}) =>
  api.get('/news', { params }).then((r) => r.data);
