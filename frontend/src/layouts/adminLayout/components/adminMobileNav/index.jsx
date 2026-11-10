import { NavLink, Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ADMIN_NAV } from '~/layouts/adminLayout/constants';
import { cn } from '~/utils/cn';

export default function AdminMobileNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-ink-900/90 backdrop-blur-xl border-t border-ink-800 flex">
      <Link
        to="/"
        className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium text-ink-500 hover:text-ink-100 transition-colors"
      >
        <Home className="w-5 h-5" />
        Trang chính
      </Link>
      {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
            isActive ? 'text-primary-400' : 'text-ink-500'
          )}
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
