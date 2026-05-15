import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { AuroraBackground } from '../components/landing/AuroraBackground';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white">
      <AuroraBackground />

      <div className="container-narrow relative z-10 py-16 text-center flex flex-col items-center justify-center min-h-screen">
        <FileQuestion className="w-24 h-24 text-purple-500 dark:text-purple-400 mx-auto mb-6" />
        <h1 className="text-display text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-body-lg text-gray-600 dark:text-white/70 mb-8">Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
        <Link to="/" className="btn-primary btn-lg">Về Trang Chủ</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
