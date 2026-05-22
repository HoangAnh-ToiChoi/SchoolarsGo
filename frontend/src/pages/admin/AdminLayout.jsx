import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen } from 'lucide-react';
import { cn } from '../../utils/helpers';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/scholarships', label: 'Học bổng', icon: BookOpen },
];

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <div className="flex min-h-screen pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-ink-800 bg-ink-900/80 backdrop-blur-xl pt-8 pb-6 px-4 gap-1">
          <p className="text-caption font-bold uppercase tracking-widest text-ink-500 px-3 mb-4">
            Admin Panel
          </p>
          {NAV.map(({ to, label, icon: Icon, end }) => (
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

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-ink-900/90 backdrop-blur-xl border-t border-ink-800 flex">
          {NAV.map(({ to, label, icon: Icon, end }) => (
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

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
