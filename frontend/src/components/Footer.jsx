import { GraduationCap, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="mb-4 inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-400">
                <GraduationCap className="w-5 h-5 text-ink-950" />
              </div>
              <span className="text-lg font-bold text-ink-100">ScholarsGo</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-ink-500 leading-relaxed">
              Nền tảng AI hỗ trợ săn học bổng và quản lý lộ trình du học toàn diện cho sinh viên Việt Nam.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-ink-300">Liên kết nhanh</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/scholarships', label: 'Tìm học bổng' },
                { to: '/saved', label: 'Học bổng đã lưu' },
                { to: '/applications', label: 'Đơn ứng tuyển' },
                { to: '/dashboard', label: 'Hồ sơ cá nhân' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-ink-500 hover:text-ink-200 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-ink-300">Liên hệ</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:contact@scholarsgo.com" className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-200 transition-colors">
                  <Mail className="w-4 h-4" />
                  contact@scholarsgo.com
                </a>
              </li>
              <li>
                <a href="https://github.com/scholarsgo" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-200 transition-colors">
                  <Github className="w-4 h-4" />
                  github.com/scholarsgo
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-8 md:flex-row">
          <p className="text-sm text-ink-500">&copy; {currentYear} ScholarsGo. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="#" className="text-sm text-ink-500 hover:text-ink-200 transition-colors">Điều khoản sử dụng</Link>
            <Link to="#" className="text-sm text-ink-500 hover:text-ink-200 transition-colors">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
