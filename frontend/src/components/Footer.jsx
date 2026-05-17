import { GraduationCap, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-lg font-bold">ScholarsGo</span>
            </Link>
            <p className="text-sm max-w-md">
              Nền tảng tìm kiếm học bổng và quản lý hồ sơ du học dành cho sinh viên Việt Nam.
              Hỗ trợ bạn từ việc tìm học bổng phù hợp đến khi nhận được kết quả.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/scholarships" className="hover:text-white transition-colors">Tìm học bổng</Link></li>
              <li><Link to="/saved" className="hover:text-white transition-colors">Học bổng đã lưu</Link></li>
              <li><Link to="/applications" className="hover:text-white transition-colors">Đơn ứng tuyển</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Hồ sơ cá nhân</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>contact@scholarsgo.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                <span>github.com/scholarsgo</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          <p>&copy; {currentYear} ScholarsGo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
