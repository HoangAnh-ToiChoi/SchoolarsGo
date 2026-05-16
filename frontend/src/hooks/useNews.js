import { useQuery } from '@tanstack/react-query';
import { fetchNews } from '../services/newsService';

export const useNews = (params = {}) =>
  useQuery({
    queryKey: ['news', params],
    queryFn: () => fetchNews(params),
    staleTime: 30 * 60 * 1000,
  });
