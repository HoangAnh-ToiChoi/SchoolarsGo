import {
  BellIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  HomeIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';

// Danh sách mục của sidebar. Thêm trang mới chỉ cần thêm một dòng ở đây.
export const NAV_SECTIONS = [
  {
    title: 'Khám phá',
    items: [
      { to: '/', label: 'Trang chủ', icon: HomeIcon },
      { to: '/recommend', label: 'Gợi ý cho bạn', icon: SparklesIcon, badge: 'AI' },
    ],
  },
  {
    title: 'Của tôi',
    items: [
      { to: '/saved', label: 'Đã lưu', icon: BookmarkIcon },
      { to: '/applications', label: 'Đơn ứng tuyển', icon: DocumentTextIcon },
      { to: '/deadlines', label: 'Lịch deadline', icon: CalendarDaysIcon },
      { to: '/notifications', label: 'Thông báo', icon: BellIcon },
    ],
  },
];
