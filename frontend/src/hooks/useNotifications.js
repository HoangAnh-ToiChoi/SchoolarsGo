import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { notificationService } from '~/services/notification.service';
import { selectIsAuthenticated } from '~/store/slices/authSlice';

const KEY = ['notifications'];
// Mở tab lâu thì vẫn thấy nhắc hạn mới (server tạo lúc 7:00 mỗi sáng)
const REFRESH_MS = 5 * 60 * 1000;

// Thông báo của người dùng: server tạo nhắc hạn (14/7/1 ngày) và lưu trạng thái đã đọc,
// nên đổi máy/trình duyệt vẫn đúng.
export function useNotifications() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: KEY,
    queryFn: () => notificationService.getAll().then((res) => res.data),
    enabled: isAuthenticated,
    refetchInterval: REFRESH_MS,
  });

  // Đánh dấu ngay trên giao diện, lỗi thì trả lại như cũ
  const optimistic = (isTarget) => ({
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData(KEY);
      queryClient.setQueryData(KEY, (old) => {
        if (!old) return old;
        const now = new Date().toISOString();
        const data = old.data.map((n) => (isTarget(n, id) && !n.read_at ? { ...n, read_at: now } : n));
        return { ...old, data, meta: { ...old.meta, unread: data.filter((n) => !n.read_at).length } };
      });
      return { previous };
    },
    onError: (_err, _id, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    ...optimistic((n, id) => n.id === id),
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    ...optimistic(() => true),
  });

  const items = query.data?.data ?? [];
  return {
    items,
    unreadCount: query.data?.meta?.unread ?? items.filter((n) => !n.read_at).length,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    markRead: (id) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}
