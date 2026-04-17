import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scholarshipService, savedService } from '../services';
import toast from 'react-hot-toast';

export const useScholarships = (filters) => {
  return useQuery({
    queryKey: ['scholarships', filters],
    queryFn: () => scholarshipService.getAll(filters).then((res) => res.data),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useScholarship = (id) => {
  return useQuery({
    queryKey: ['scholarship', id],
    queryFn: () => scholarshipService.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useFeaturedScholarships = () => {
  return useQuery({
    queryKey: ['scholarships', 'featured'],
    queryFn: () => scholarshipService.getFeatured().then((res) => res.data),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: () => scholarshipService.getCountries().then((res) => res.data),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useToggleSaveScholarship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scholarshipId, isSaved, note }) => {
      if (isSaved) {
        return savedService.remove(scholarshipId);
      } else {
        return savedService.save(scholarshipId, note);
      }
    },
    onSuccess: (_, { isSaved }) => {
      queryClient.invalidateQueries({ queryKey: ['scholarships'] });
      queryClient.invalidateQueries({ queryKey: ['saved'] });
      toast.success(isSaved ? 'Đã bỏ lưu học bổng' : 'Đã lưu học bổng');
    },
    onError: (error) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });
};

export const useSavedScholarships = () => {
  return useQuery({
    queryKey: ['saved'],
    queryFn: () => savedService.getAll().then((res) => res.data),
  });
};
