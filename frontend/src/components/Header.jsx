import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Menu, X, User, LogOut, BookOpen, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

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
    <header className="bg-surface shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-700 transition-colors">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ScholarsGo</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user?.full_name || user?.email}</span>
                </Link>
                <Link to="/applications" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Đơn ứng tuyển</span>
                </Link>
                <Link to="/deadlines" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Deadline</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
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

          {/* Mobile Toggle */}
          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-gray-100 animate-slide-down">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-gray-600 hover:text-primary-600 font-medium py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setMobileOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/applications" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setMobileOpen(false)}>
                    Đơn ứng tuyển
                  </Link>
                  <Link to="/deadlines" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setMobileOpen(false)}>
                    Deadline
                  </Link>
                  <button onClick={handleLogout} className="block text-danger-600 font-medium py-2 w-full text-left">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setMobileOpen(false)}>
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
