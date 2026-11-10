import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { applicationService } from '~/services/application.service';
import toast from 'react-hot-toast';
import { selectIsAuthenticated } from '~/store/slices/authSlice';

// Backend trả học bổng kèm theo ở khóa `scholarships` (tên bảng của Supabase); đổi về `scholarship` cho dễ đọc
const withScholarship = (app) => (app ? { ...app, scholarship: app.scholarship ?? app.scholarships ?? null } : app);

export const useApplications = (filters = {}) => {
  // Chuông thông báo trên header cũng đọc danh sách đơn: chưa đăng nhập thì không gọi (tránh 401)
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return useQuery({
    queryKey: ['applications', filters],
    enabled: isAuthenticated,
    queryFn: () =>
      applicationService.getAll(filters).then((res) => ({ ...res.data, data: (res.data?.data ?? []).map(withScholarship) })),
  });
};

export const useApplication = (id) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getById(id).then((res) => ({ ...res.data, data: withScholarship(res.data?.data) })),
    enabled: !!id,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => applicationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', variables.id] });
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
