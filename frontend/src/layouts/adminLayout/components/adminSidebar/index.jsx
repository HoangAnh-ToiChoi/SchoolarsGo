import { NavLink, Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ADMIN_NAV } from '~/layouts/adminLayout/constants';
import { cn } from '~/utils/cn';

export default function AdminSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-ink-800 bg-ink-900/80 backdrop-blur-xl pt-8 pb-6 px-4 gap-1">
      <p className="text-caption font-bold uppercase tracking-widest text-ink-500 px-3 mb-4">
        Admin Panel
      </p>
      <Link
        to="/"
        className="flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-ink-100 transition-all mb-2"
      >
        <Home className="w-4 h-4 shrink-0" />
        Về trang chính
      </Link>
      {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-all',
            isActive
              ? 'bg-primary-400/10 text-primary-400'
              : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100'
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
