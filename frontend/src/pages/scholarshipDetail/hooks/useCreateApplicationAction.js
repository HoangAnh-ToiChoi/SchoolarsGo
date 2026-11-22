import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useCreateApplication } from '~/hooks/useApplication';
import { selectIsAuthenticated } from '~/store/slices/authSlice';
import { ROUTES } from '~/utils/routes';

/**
 * Hook quản lý toàn bộ luồng tạo đơn ứng tuyển trong ActionPanel.
 * - Kiểm tra trạng thái xác thực người dùng.
 * - Hiển thị toast thông báo nếu chưa đăng nhập.
 * - Gọi mutation tạo đơn và điều hướng sang trang applications khi thành công.
 * - Xóa bỏ hoàn toàn khối try/catch rỗng khỏi UI component (R7).
 */
export function useCreateApplicationAction(scholarshipId) {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const createApplicationMutation = useCreateApplication();

  const handleCreateApplication = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tạo đơn ứng tuyển');
      return;
    }

    createApplicationMutation.mutate(
      { scholarship_id: scholarshipId },
      {
        onSuccess: () => {
          navigate(ROUTES.applications);
        },
      }
    );
  };

  return {
    handleCreateApplication,
    createApplication: handleCreateApplication,
    isPending: createApplicationMutation.isPending,
  };
}
