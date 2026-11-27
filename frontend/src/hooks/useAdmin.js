import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '~/services/admin.service';
import toast from 'react-hot-toast';

const USERS_KEY = ['admin', 'users'];
const SCHOLARSHIPS_KEY = ['scholarships'];
// Sửa / xóa học bổng: trang chi tiết, danh sách đã lưu và đơn ứng tuyển cũng nhúng dữ liệu học bổng
const SCHOLARSHIP_KEYS = [SCHOLARSHIPS_KEY, ['scholarship'], ['saved'], ['applications']];

// Mọi thao tác admin cùng một nhịp: gọi API → làm mới danh sách liên quan → báo kết quả
function useAdminMutation(mutationFn, { invalidate, success, failure }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      const keys = Array.isArray(invalidate[0]) ? invalidate : [invalidate];
      keys.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
      toast.success(success);
    },
    onError: (e) => toast.error(e.message || failure),
  });
}

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
    queryKey: [...USERS_KEY, filters],
    queryFn: () => adminService.getUsers(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useUpdateUserRole = () =>
  useAdminMutation(({ id, role }) => adminService.updateUserRole(id, role), {
    invalidate: USERS_KEY,
    success: 'Đã cập nhật role',
    failure: 'Cập nhật thất bại',
  });

export const useUpdateUserStatus = () =>
  useAdminMutation(({ id, isActive }) => adminService.updateUserStatus(id, isActive), {
    invalidate: USERS_KEY,
    success: 'Đã cập nhật trạng thái',
    failure: 'Cập nhật thất bại',
  });

export const useAdminCreateScholarship = () =>
  useAdminMutation((data) => adminService.createScholarship(data), {
    invalidate: SCHOLARSHIPS_KEY,
    success: 'Đã thêm học bổng',
    failure: 'Tạo thất bại',
  });

export const useAdminUpdateScholarship = () =>
  useAdminMutation(({ id, ...data }) => adminService.updateScholarship(id, data), {
    invalidate: SCHOLARSHIP_KEYS,
    success: 'Đã cập nhật học bổng',
    failure: 'Cập nhật thất bại',
  });

export const useAdminToggleFeatured = () =>
  useAdminMutation(({ id, isFeatured }) => adminService.toggleFeatured(id, isFeatured), {
    invalidate: SCHOLARSHIPS_KEY,
    success: 'Đã cập nhật nổi bật',
    failure: 'Cập nhật thất bại',
  });

export const useAdminDeleteScholarship = () =>
  useAdminMutation((id) => adminService.deleteScholarship(id), {
    invalidate: SCHOLARSHIP_KEYS,
    success: 'Đã xóa học bổng',
    failure: 'Xóa thất bại',
  });
