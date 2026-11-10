import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scholarshipService } from '~/services/scholarship.service';
import { savedService } from '~/services/saved.service';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '~/store/slices/authSlice';
import toast from 'react-hot-toast';

export const useScholarships = (filters) => {
  return useQuery({
    queryKey: ['scholarships', filters],
    queryFn: () => scholarshipService.getAll(filters).then((res) => res.data),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Nhận slug hoặc id (link cũ dùng UUID vẫn mở được)
export const useScholarship = (idOrSlug) => {
  return useQuery({
    queryKey: ['scholarship', idOrSlug],
    queryFn: () => scholarshipService.getById(idOrSlug).then((res) => res.data),
    enabled: !!idOrSlug && idOrSlug !== 'undefined',
    // Không tìm thấy (404) thì thử lại cũng vô ích
    retry: (failureCount, error) => error?.status !== 404 && failureCount < 2,
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
      queryClient.invalidateQueries({ queryKey: ['scholarship'] });
      queryClient.invalidateQueries({ queryKey: ['saved'] });
      // Lưu học bổng sắp hết hạn thì chuông có nhắc mới ngay
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(isSaved ? 'Đã bỏ lưu học bổng' : 'Đã lưu học bổng');
    },
    onError: (error) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });
};

export const useSavedScholarships = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return useQuery({
    queryKey: ['saved'],
    queryFn: () => savedService.getAll().then((res) => res.data),
    enabled: isAuthenticated,
  });
};
