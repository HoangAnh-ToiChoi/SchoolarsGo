import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSignal } from '~/hooks/useRealtimeSignal';
import { REALTIME_SCHOLARSHIPS } from '~/utils/constants';
import { addNewScholarshipCount } from '~/pages/home/helpers';

/**
 * Đếm học bổng mới được kéo về trong lúc người dùng đang xem trang chủ (tín hiệu realtime từ DB).
 * Không tự tải lại danh sách để thẻ đang đọc không bị nhảy chỗ: người dùng bấm "Xem ngay" mới tải.
 */
export function useNewScholarships() {
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);

  const addNew = useCallback((payload) => setCount((current) => addNewScholarshipCount(current, payload)), []);
  useRealtimeSignal(REALTIME_SCHOLARSHIPS.topic, REALTIME_SCHOLARSHIPS.event, addNew);

  const showNew = useCallback(() => {
    setCount(0);
    queryClient.invalidateQueries({ queryKey: ['scholarships'] });
  }, [queryClient]);

  return { count, showNew };
}
