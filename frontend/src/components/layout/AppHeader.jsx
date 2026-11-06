import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AcademicCapIcon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { Button } from '~/components/ui/button';
import UserMenu from '~/components/layout/UserMenu';

// Header cao 64px, chia 3 cột: logo | ô tìm kiếm | thông báo + tài khoản.
// Hai cột bên rộng bằng nhau (1fr) nên ô tìm kiếm luôn nằm chính giữa màn hình.
export default function AppHeader() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/scholarships?search=${encodeURIComponent(q)}` : '/scholarships');
  };

  return (
    <header className="sticky top-0 z-30 grid h-header grid-cols-[1fr_minmax(0,560px)_1fr] items-center gap-6 border-b border-line bg-surface px-6">
      <Link to="/" className="flex items-center gap-2.5 justify-self-start">
        <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand-600">
          <AcademicCapIcon className="size-[18px] text-white" aria-hidden="true" />
        </span>
        <span className="text-[17px] font-bold tracking-[-0.02em] text-fg">ScholarsGo</span>
      </Link>

      <form role="search" onSubmit={handleSearch} className="w-full">
        <label className="flex h-control items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-fg-muted shadow-search transition-[border-color,box-shadow] duration-200 hover:border-line-strong focus-within:border-brand-600 focus-within:ring-[3px] focus-within:ring-brand-600/15">
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
