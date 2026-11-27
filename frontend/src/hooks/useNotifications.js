import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { notificationService } from '~/services/notification.service';
import { selectIsAuthenticated } from '~/store/slices/authSlice';
import { useRealtimeSignal } from '~/hooks/useRealtimeSignal';
import { REALTIME_NOTIFICATION_EVENT } from '~/utils/constants';
import { isRealtimeEnabled } from '~/utils/realtime';

const KEY = ['notifications'];
const CHANNEL_KEY = ['notificationChannel']; // không lồng dưới KEY: invalidate KEY theo tiền tố sẽ tải lại cả kênh
// Dự phòng khi realtime tắt hoặc mất kết nối: mở tab lâu thì vẫn thấy nhắc hạn mới
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

  // Có thông báo mới thì DB phát tín hiệu lên kênh riêng của người dùng → tải lại danh sách ngay
  const channel = useQuery({
    queryKey: CHANNEL_KEY,
    queryFn: () => notificationService.getChannel().then((res) => res.data.data.topic),
    enabled: isAuthenticated && isRealtimeEnabled(),
    staleTime: Infinity,
    retry: false, // DB chưa chạy migration 010 thì thôi, đã có tự làm mới
  });
  useRealtimeSignal(channel.data, REALTIME_NOTIFICATION_EVENT, () => queryClient.invalidateQueries({ queryKey: KEY, exact: true }));

  // Đánh dấu ngay trên giao diện, lỗi thì trả lại như cũ
  const optimistic = (isTarget) => ({
    onMutate: async function onMutate(id) {
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
