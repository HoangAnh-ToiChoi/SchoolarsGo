import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <FileQuestion className="w-24 h-24 text-gray-300 mx-auto mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 — Trang không tìm thấy</h1>
      <p className="text-gray-600 mb-8">Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
      <Link to="/" className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors">Về Trang Chủ</Link>
    </div>
  );
};

export default NotFoundPage;
