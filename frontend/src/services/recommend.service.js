import api from '~/lib/apiClient';

// AI Recommender
export const recommendService = {
  recommend: (topN) => api.post('/recommend', { top_n: topN }),
};
