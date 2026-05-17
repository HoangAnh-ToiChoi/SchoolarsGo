import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Menu, X, User, LogOut, BookOpen, MessageSquare, Sparkles, Sun, Moon, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

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

  return (
    <header className="bg-surface dark:bg-gray-900/95 shadow-sm dark:shadow-gray-900/50 dark:border-b dark:border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-primary-600 dark:bg-gradient-to-br dark:from-purple-500 dark:to-cyan-500 rounded-lg flex items-center justify-center group-hover:bg-primary-700 transition-colors dark:shadow-lg dark:shadow-purple-500/25">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ScholarsGo</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth + Theme Toggle */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white transition-colors">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user?.full_name || user?.email}</span>
                </Link>
                <Link to="/applications" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Đơn ứng tuyển</span>
                </Link>
                <Link to="/recommend" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white transition-colors">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Gợi ý AI</span>
                </Link>
                <Link to="/chat" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium">Chat AI</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin/users" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white transition-colors">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-medium transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="btn-primary btn-sm"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Theme toggle + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              className="btn-ghost dark:text-gray-300 dark:hover:bg-white/10 p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface dark:bg-gray-900 border-t border-gray-100 dark:border-white/10 animate-slide-down">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-medium py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 dark:border-white/10 space-y-3">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-medium py-2" onClick={() => setMobileOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/applications" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-medium py-2" onClick={() => setMobileOpen(false)}>
                    Đơn ứng tuyển
                  </Link>
                  <Link to="/recommend" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-medium py-2" onClick={() => setMobileOpen(false)}>
                    Gợi ý AI
                  </Link>
                  <Link to="/chat" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-medium py-2" onClick={() => setMobileOpen(false)}>
                    Chat AI
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/users" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-medium py-2" onClick={() => setMobileOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="block text-danger-600 dark:text-red-400 font-medium py-2 w-full text-left">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white font-medium py-2" onClick={() => setMobileOpen(false)}>
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="block btn-primary text-center" onClick={() => setMobileOpen(false)}>
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
