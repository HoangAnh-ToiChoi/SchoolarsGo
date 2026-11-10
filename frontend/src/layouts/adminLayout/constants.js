import { LayoutDashboard, Users, BookOpen } from 'lucide-react';

// Các mục điều hướng của trang admin — dùng chung cho sidebar (desktop) và thanh dưới (mobile)
export const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/scholarships', label: 'Học bổng', icon: BookOpen },
];
