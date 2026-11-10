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

// Cập nhật ngay trên giao diện rồi mới gọi API (tick giấy tờ phải phản hồi tức thì); lỗi thì trả lại như cũ.
// Không báo thành công ở đây vì tick checklist rất thường xuyên — nơi gọi tự báo khi cần.
export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) => applicationService.update(id, data),
    onMutate: async ({ id, ...data }) => {
      const key = ['application', id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      if (previous?.data) queryClient.setQueryData(key, { ...previous, data: { ...previous.data, ...data } });
      return { previous };
    },
    onError: (error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(['application', id], context.previous);
      toast.error(error.message || 'Cập nhật đơn thất bại');
    },
    onSettled: (_data, _error, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      // Nộp/rút đơn làm thay đổi nhắc hạn trên chuông
      if (status) queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => applicationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã xóa đơn ứng tuyển');
    },
    onError: (error) => {
      toast.error(error.message || 'Xóa đơn thất bại');
    },
  });
};
