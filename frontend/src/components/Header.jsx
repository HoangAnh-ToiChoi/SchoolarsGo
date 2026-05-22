import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, User, LogOut, BookOpen, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from './ui/ThemeToggle';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navLinks = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Học bổng', to: '/scholarships' },
    { label: 'Đã lưu', to: '/saved' },
  ];

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const navLinkClass = (to) =>
    `px-3 py-2 rounded text-sm font-medium transition-colors ${
      isActive(to)
        ? 'text-primary-400 bg-primary-400/10'
        : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-ink-950/90 backdrop-blur-md border-b border-ink-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-400 transition-shadow group-hover:shadow-glow">
              <GraduationCap className="w-5 h-5 text-ink-950" />
            </div>
            <span className="text-lg font-bold text-ink-100">ScholarsGo</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={navLinkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-1">
            <ThemeToggle className="text-ink-400 hover:text-ink-100 hover:bg-ink-800" />
            {isAuthenticated ? (
              <>
                <Link to="/applications" className={`flex items-center gap-1.5 ${navLinkClass('/applications')}`}>
                  <BookOpen className="w-4 h-4" />
                  Đơn ứng tuyển
                </Link>
                <Link to="/deadlines" className={`flex items-center gap-1.5 ${navLinkClass('/deadlines')}`}>
                  <Calendar className="w-4 h-4" />
                  Deadline
                </Link>
                <Link to="/profile" className={`flex items-center gap-1.5 ${navLinkClass('/profile')}`}>
                  <User className="w-4 h-4" />
                  {user?.full_name?.split(' ').pop() || user?.email}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium text-ink-500 hover:text-danger-400 hover:bg-danger-400/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded text-sm font-medium text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary btn-sm">
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded border border-ink-800 text-ink-400 hover:bg-ink-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink-800 bg-ink-950 animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block ${navLinkClass(link.to)}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-ink-800 space-y-1">
              <div className="px-3 py-2.5">
                <ThemeToggle className="text-ink-400 hover:text-ink-100 hover:bg-ink-800" />
              </div>
              {isAuthenticated ? (
                <>
                  <Link to="/applications" className="block px-3 py-2.5 rounded text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => setMobileOpen(false)}>Đơn ứng tuyển</Link>
                  <Link to="/deadlines" className="block px-3 py-2.5 rounded text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => setMobileOpen(false)}>Deadline</Link>
                  <Link to="/profile" className="block px-3 py-2.5 rounded text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => setMobileOpen(false)}>Hồ sơ</Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded text-sm font-medium text-danger-400 hover:bg-danger-400/10 transition-colors">Đăng xuất</button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link to="/login" className="text-center px-4 py-2.5 rounded border border-ink-700 text-sm font-medium text-ink-300 hover:bg-ink-800" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
                  <Link to="/register" className="text-center btn-primary" onClick={() => setMobileOpen(false)}>Đăng ký</Link>
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
