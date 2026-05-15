import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, User, LogOut, BookOpen, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import ThemeToggle from './ui/ThemeToggle';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage =
    location.pathname === '/' ||
    location.pathname.startsWith('/scholarships') ||
    location.pathname === '/saved' ||
    location.pathname === '/applications' ||
    location.pathname === '/deadlines' ||
    location.pathname === '/login' ||
    location.pathname === '/register';

  // In light mode, always use the light header regardless of route
  const isDarkHeader = theme === 'dark' && isHomePage;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navLinks = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Tìm học bổng', to: '/scholarships' },
    { label: 'Đã lưu', to: '/saved' },
  ];

  const headerBg = isDarkHeader
    ? 'fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md bg-black/20'
    : 'sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/10 shadow-sm';

  const textColor = isDarkHeader
    ? 'text-white/70 hover:text-white'
    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white';

  const logoText = isDarkHeader
    ? 'text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]'
    : 'text-gray-900 dark:text-white';

  const toggleBtnClass = isDarkHeader
    ? 'border-white/20 bg-white/5 text-white'
    : 'border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 text-gray-600 dark:text-gray-300';

  const themeToggleClass = isDarkHeader
    ? 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10';

  return (
    <header className={headerBg}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/25 transition-transform group-hover:scale-105">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xl font-bold transition-all group-hover:drop-shadow-[0_0_15px_rgba(168,85,247,0.7)] ${logoText}`}>
              ScholarsGo
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${textColor}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth + ThemeToggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle className={themeToggleClass} />

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className={`flex items-center gap-2 text-sm transition-colors ${textColor}`}>
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user?.full_name || user?.email}</span>
                </Link>
                <Link to="/applications" className={`flex items-center gap-2 text-sm transition-colors ${textColor}`}>
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Đơn ứng tuyển</span>
                </Link>
                <Link to="/deadlines" className={`flex items-center gap-2 text-sm transition-colors ${textColor}`}>
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Deadline</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    isDarkHeader
                      ? 'border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-purple-500/50 duration-300"
                >
                  Đăng ký ngay
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className={`md:hidden flex h-10 w-10 items-center justify-center rounded-lg border ${toggleBtnClass} backdrop-blur-sm`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={`md:hidden border-t ${isDarkHeader ? 'border-white/10 bg-black/50 backdrop-blur-xl' : 'border-gray-100 bg-white dark:bg-gray-900 shadow-lg'} animate-slide-down`}>
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block rounded-lg px-4 py-3 font-medium transition-colors ${
                  isDarkHeader
                    ? 'text-white/70 hover:bg-white/5 hover:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-white'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className={`pt-3 mt-2 border-t flex items-center gap-2 ${isDarkHeader ? 'border-white/10' : 'border-gray-100 dark:border-white/10'}`}>
              <ThemeToggle className={themeToggleClass} />
              <span className={`text-sm ${isDarkHeader ? 'text-white/50' : 'text-gray-500 dark:text-gray-400'}`}>
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </span>
            </div>
            <div className={`pt-4 mt-2 border-t space-y-2 ${isDarkHeader ? 'border-white/10' : 'border-gray-100 dark:border-white/10'}`}>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className={`block rounded-lg px-4 py-3 font-medium transition-colors ${isDarkHeader ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`} onClick={() => setMobileOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/applications" className={`block rounded-lg px-4 py-3 font-medium transition-colors ${isDarkHeader ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`} onClick={() => setMobileOpen(false)}>
                    Đơn ứng tuyển
                  </Link>
                  <Link to="/deadlines" className={`block rounded-lg px-4 py-3 font-medium transition-colors ${isDarkHeader ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`} onClick={() => setMobileOpen(false)}>
                    Deadline
                  </Link>
                  <button onClick={handleLogout} className="block rounded-lg px-4 py-3 text-red-400 font-medium w-full text-left transition-colors hover:bg-red-500/10 hover:text-red-500">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" className={`rounded-lg text-center px-4 py-3 text-sm font-medium transition-all ${isDarkHeader ? 'border border-white/20 bg-white/5 text-white' : 'border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 text-gray-600 dark:text-gray-300'}`} onClick={() => setMobileOpen(false)}>
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="rounded-lg text-center bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30" onClick={() => setMobileOpen(false)}>
                    Đăng ký ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
