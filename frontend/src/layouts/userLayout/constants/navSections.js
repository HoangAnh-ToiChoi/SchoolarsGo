import {
  BookmarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  HomeIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import { ROUTES } from '~/utils/routes';

// Danh sách mục của sidebar. Thêm trang mới chỉ cần thêm một dòng ở đây.
// Thông báo không có trang riêng: nằm ở chuông trên header.
export const NAV_SECTIONS = [
  {
    title: 'Khám phá',
    items: [
      { to: ROUTES.home, label: 'Trang chủ', icon: HomeIcon },
      { to: ROUTES.recommend, label: 'Gợi ý cho bạn', icon: SparklesIcon, badge: 'AI' },
    ],
  },
  {
    title: 'Của tôi',
    items: [
      { to: ROUTES.saved, label: 'Đã lưu', icon: BookmarkIcon },
      { to: ROUTES.applications, label: 'Đơn ứng tuyển', icon: DocumentTextIcon },
      { to: ROUTES.deadlines, label: 'Lịch deadline', icon: CalendarDaysIcon },
    ],
  },
];
