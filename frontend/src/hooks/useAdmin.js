import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services';
import toast from 'react-hot-toast';

export const useAdminUsers = (params) =>
  useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getUsers(params).then((r) => r.data),
    staleTime: 1000 * 60,
  });

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Cập nhật role thành công');
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể cập nhật role');
    },
  });
};
