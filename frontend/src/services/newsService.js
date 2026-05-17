import api from './api';

export const fetchNews = (params = {}) =>
  api.get('/news', { params }).then((r) => r.data);
