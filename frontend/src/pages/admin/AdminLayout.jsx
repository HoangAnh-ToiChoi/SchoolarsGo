import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { AuroraBackground } from '../../components/landing/AuroraBackground';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/scholarships', label: 'Học bổng', icon: BookOpen },
];

const AdminLayout = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white">
      <AuroraBackground />

      <div className="relative z-10 flex min-h-screen pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 backdrop-blur-xl pt-8 pb-6 px-4 gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 px-3 mb-4">
            Admin Panel
          </p>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </aside>

        {/* Mobile top nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 flex">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-white/50'
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
