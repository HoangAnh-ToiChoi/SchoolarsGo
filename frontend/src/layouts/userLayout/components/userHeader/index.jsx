import { Link } from 'react-router-dom';
import { AcademicCapIcon } from '@heroicons/react/24/solid';
import MobileNav from '~/layouts/userLayout/components/mobileNav';
import NotificationMenu from '~/layouts/userLayout/components/notificationMenu';
import UserMenu from '~/layouts/userLayout/components/userMenu';
import ScholarshipFilter from '~/components/scholarshipFilter';

// Header cao 64px, chia 3 cột: logo | ô tìm kiếm | thông báo + tài khoản.
// Từ lg: hai cột bên rộng bằng nhau (1fr) nên ô tìm kiếm luôn nằm chính giữa màn hình.
// Nhỏ hơn: hai cột bên co theo nội dung (nút menu + logo thu gọn, chỉ còn avatar) để ô tìm kiếm đủ rộng.
export default function UserHeader() {
  return (
    <header className="sticky top-0 z-30 grid h-header grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-line bg-surface px-3 sm:gap-4 sm:px-4 lg:grid-cols-[1fr_minmax(0,560px)_1fr] lg:gap-6 lg:px-6">
      <div className="flex items-center gap-1 justify-self-start">
        <MobileNav />
        <Link to="/" aria-label="ScholarsGo — Trang chủ" className="flex items-center gap-2.5 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-brand-600">
            <AcademicCapIcon className="size-[18px] text-white" aria-hidden="true" />
          </span>
          <span className="hidden text-[17px] font-bold tracking-[-0.02em] text-fg sm:inline">ScholarsGo</span>
        </Link>
      </div>

      {/* Thanh tìm kiếm duy nhất + bảng bộ lọc (bấm vào ô mới hiện) */}
      <ScholarshipFilter />

      <div className="flex items-center gap-1 justify-self-end sm:gap-2">
        <NotificationMenu />
        <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-line md:block" />
        <UserMenu />
      </div>
    </header>
  );
}
