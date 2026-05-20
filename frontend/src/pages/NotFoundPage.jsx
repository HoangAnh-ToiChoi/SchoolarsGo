import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <motion.div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center px-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <FileQuestion className="w-16 h-16 text-ink-700 mx-auto mb-6" />
      <h1 className="text-6xl font-extrabold text-ink-100 mb-3">404</h1>
      <p className="text-lg text-ink-400 mb-8 max-w-md">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link to="/" className="btn-primary btn-lg">Về Trang Chủ</Link>
    </motion.div>
  );
};

export default NotFoundPage;
