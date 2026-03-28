import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../services';
import toast from 'react-hot-toast';

export const useApplications = (filters = {}) => {
  return useQuery({
    queryKey: ['applications', filters],
    queryFn: () => applicationService.getAll(filters).then((res) => res.data),
  });
};

export const useApplication = (id) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => applicationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Tạo application thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Tạo application thất bại');
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) => applicationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Cập nhật application thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Cập nhật thất bại');
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => applicationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Xóa application thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Xóa thất bại');
    },
  });
};
