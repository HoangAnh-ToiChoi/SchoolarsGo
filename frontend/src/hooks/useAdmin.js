import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';

export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getStats().then((r) => r.data.data),
  });

export const useAdminChartStats = () =>
  useQuery({
    queryKey: ['admin', 'stats', 'chart'],
    queryFn: () => adminService.getChartStats().then((r) => r.data.data),
  });

export const useAdminUsers = (filters) =>
  useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminService.getUsers(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => adminService.updateUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Đã cập nhật role');
    },
    onError: (e) => toast.error(e.message || 'Cập nhật thất bại'),
  });
};

export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => adminService.updateUserStatus(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Đã cập nhật trạng thái');
    },
    onError: (e) => toast.error(e.message || 'Cập nhật thất bại'),
  });
};

export const useAdminCreateScholarship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createScholarship(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scholarships'] });
      toast.success('Đã thêm học bổng');
    },
    onError: (e) => toast.error(e.message || 'Tạo thất bại'),
  });
};

export const useAdminUpdateScholarship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateScholarship(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scholarships'] });
      toast.success('Đã cập nhật học bổng');
    },
    onError: (e) => toast.error(e.message || 'Cập nhật thất bại'),
  });
};

export const useAdminToggleFeatured = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFeatured }) => adminService.toggleFeatured(id, isFeatured),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scholarships'] });
      toast.success('Đã cập nhật nổi bật');
    },
    onError: (e) => toast.error(e.message || 'Cập nhật thất bại'),
  });
};

export const useAdminDeleteScholarship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteScholarship(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scholarships'] });
      toast.success('Đã xóa học bổng');
    },
    onError: (e) => toast.error(e.message || 'Xóa thất bại'),
  });
};
