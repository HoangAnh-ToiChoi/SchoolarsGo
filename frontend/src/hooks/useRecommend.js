import { useQuery } from '@tanstack/react-query';
import { recommendService } from '../services';

export const useRecommend = (topN = 10, enabled = true) => {
  return useQuery({
    queryKey: ['recommend', topN],
    queryFn: () => recommendService.recommend(topN).then((res) => res.data),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
