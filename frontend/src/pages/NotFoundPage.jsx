import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="container-narrow py-16 text-center">
      <FileQuestion className="w-24 h-24 text-gray-300 mx-auto mb-6" />
      <h1 className="text-display text-gray-900 mb-4">404</h1>
      <p className="text-body-lg text-gray-600 mb-8">Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
      <Link to="/" className="btn-primary btn-lg">Về Trang Chủ</Link>
    </div>
  );
};

export default NotFoundPage;
