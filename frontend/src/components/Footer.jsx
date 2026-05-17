import { GraduationCap, Github, Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const isHomePage = 
    location.pathname === '/' || 
    location.pathname.startsWith('/scholarships') || 
    location.pathname === '/saved' ||
    location.pathname === '/applications' ||
    location.pathname === '/deadlines' ||
    location.pathname === '/login' ||
    location.pathname === '/register';

  // Conditional background
  const footerBg = isHomePage 
    ? 'relative border-t border-white/10 bg-[#050510]' 
    : 'relative border-t border-slate-800 bg-slate-950';

  return (
    <footer className={footerBg}>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="mb-4 inline-flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/25 transition-transform group-hover:scale-105">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white transition-all group-hover:drop-shadow-[0_0_15px_rgba(168,85,247,0.7)]">
                ScholarsGo
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-white/50 leading-relaxed">
              Nền tảng AI hỗ trợ săn học bổng và quản lý lộ trình du học toàn diện cho sinh viên Việt Nam.
              Hỗ trợ bạn từ việc tìm học bổng phù hợp đến khi nhận được kết quả.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Liên kết nhanh</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/scholarships" className="text-sm text-white/50 transition-colors hover:text-white">
                  Tìm học bổng
                </Link>
              </li>
              <li>
                <Link to="/saved" className="text-sm text-white/50 transition-colors hover:text-white">
                  Học bổng đã lưu
                </Link>
              </li>
              <li>
                <Link to="/applications" className="text-sm text-white/50 transition-colors hover:text-white">
                  Đơn ứng tuyển
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm text-white/50 transition-colors hover:text-white">
                  Hồ sơ cá nhân
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Liên hệ</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:contact@scholarsgo.com" className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white">
                  <Mail className="w-4 h-4" />
                  contact@scholarsgo.com
                </a>
              </li>
              <li>
                <a href="https://github.com/scholarsgo" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white">
                  <Github className="w-4 h-4" />
                  github.com/scholarsgo
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/40">
            &copy; {currentYear} ScholarsGo. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="#" className="text-sm text-white/40 hover:text-white transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link to="#" className="text-sm text-white/40 hover:text-white transition-colors">
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

