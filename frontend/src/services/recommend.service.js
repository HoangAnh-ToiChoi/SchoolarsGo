import api from '~/lib/api-client';

// AI Recommender
export const recommendService = {
  recommend: (topN) => api.post('/recommend', { top_n: topN }),
};
