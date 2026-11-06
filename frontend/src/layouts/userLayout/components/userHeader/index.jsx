import { Link } from 'react-router-dom';
import { AcademicCapIcon, BellIcon } from '@heroicons/react/24/solid';
import { Button } from '~/components/ui/button';
import UserMenu from '~/layouts/userLayout/components/userMenu';
import ScholarshipFilter from '~/components/scholarshipFilter';

// Header cao 64px, chia 3 cột: logo | ô tìm kiếm | thông báo + tài khoản.
// Hai cột bên rộng bằng nhau (1fr) nên ô tìm kiếm luôn nằm chính giữa màn hình.
export default function UserHeader() {
  return (
    <header className="sticky top-0 z-30 grid h-header grid-cols-[1fr_minmax(0,560px)_1fr] items-center gap-6 border-b border-line bg-surface px-6">
      <Link to="/" className="flex items-center gap-2.5 justify-self-start">
        <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand-600">
          <AcademicCapIcon className="size-[18px] text-white" aria-hidden="true" />
        </span>
        <span className="text-[17px] font-bold tracking-[-0.02em] text-fg">ScholarsGo</span>
      </Link>

      {/* Thanh tìm kiếm duy nhất + bảng bộ lọc (bấm vào ô mới hiện) */}
      <ScholarshipFilter />

      <div className="flex items-center gap-2 justify-self-end">
        <Button asChild variant="outline" size="icon-lg" className="relative border-line text-fg-soft shadow-none hover:bg-hover">
          <Link to="/notifications" aria-label="Thông báo">
            <BellIcon aria-hidden="true" />
          </Link>
        </Button>
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />
        <UserMenu />
      </div>
    </header>
  );
}
