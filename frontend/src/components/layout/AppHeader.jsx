import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AcademicCapIcon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { Button } from '~/components/ui/button';
import UserMenu from '~/components/layout/UserMenu';

// Header cao 64px. Khối logo rộng bằng sidebar (256px) + ô tìm kiếm cách 32px
// → ô tìm kiếm thẳng hàng với mép trái vùng nội dung.
export default function AppHeader() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/scholarships?search=${encodeURIComponent(q)}` : '/scholarships');
  };

  return (
    <header className="sticky top-0 z-30 flex h-header items-center border-b border-line bg-surface pr-8">
      <Link to="/" className="flex w-sidebar shrink-0 items-center gap-2.5 pl-6">
        <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand-600">
          <AcademicCapIcon className="size-[18px] text-white" aria-hidden="true" />
        </span>
        <span className="text-[17px] font-bold tracking-[-0.02em] text-fg">ScholarsGo</span>
      </Link>

      <form role="search" onSubmit={handleSearch} className="ml-8 max-w-[480px] flex-1">
        <label className="flex h-control items-center gap-2.5 rounded-inner border border-line bg-surface pl-3 pr-2 text-fg-muted transition-[border-color,box-shadow] duration-200 focus-within:border-brand-600 focus-within:ring-[3px] focus-within:ring-brand-600/15">
          <MagnifyingGlassIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Tìm học bổng</span>
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm học bổng, trường, quốc gia…"
            className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
          />
        </label>
      </form>

      <div className="ml-auto flex items-center gap-2 pl-4">
        <Button asChild variant="outline" size="icon-lg" className="relative border-line text-[#3F3F46] shadow-none hover:bg-[#F4F4F5]">
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
