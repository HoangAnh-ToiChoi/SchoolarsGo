import { LayoutDashboard, Users, BookOpen } from 'lucide-react';
import { ROUTES } from '~/utils/routes';

// Các mục điều hướng của trang admin — dùng chung cho sidebar (desktop) và thanh dưới (mobile)
export const ADMIN_NAV = [
  { to: ROUTES.admin.dashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.admin.users, label: 'Người dùng', icon: Users },
  { to: ROUTES.admin.scholarships, label: 'Học bổng', icon: BookOpen },
];
