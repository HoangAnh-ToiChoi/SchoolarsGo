import api from '~/utils/apiClient';

// AI Recommender
export const recommendService = {
  recommend: (topN) => api.post('/recommend', { top_n: topN }),
};
