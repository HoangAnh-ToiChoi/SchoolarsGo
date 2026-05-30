import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSavedScholarships } from '../hooks/useScholarship';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const SavedPage = () => {
  const { data, isLoading } = useSavedScholarships();

  const saved = data?.data || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-screen bg-ink-950 pb-24">
      <div className="container-page pt-10 mb-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-800 bg-ink-900 px-4 py-1.5 text-sm text-ink-300 mb-5">
            <Heart className="w-4 h-4 text-primary-400" />
            <span>Danh sách theo dõi</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-100 mb-4">
            Học Bổng Đã Lưu
          </h1>
          <p className="text-ink-400 max-w-2xl mx-auto">
            Các cơ hội học bổng bạn đã bookmark để tiện theo dõi và lên kế hoạch ứng tuyển.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center"><LoadingSpinner /></div>
        ) : saved.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-ink-900 border border-ink-800 rounded-card p-12 text-center">
            <div className="w-20 h-20 bg-ink-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-ink-500" />
            </div>
            <h2 className="text-2xl font-bold text-ink-100 mb-4">Chưa có học bổng nào</h2>
            <p className="text-ink-400 text-lg mb-8">
              Khám phá danh sách hàng ngàn học bổng toàn cầu và thả tim để lưu vào danh sách của bạn.
            </p>
            <Link to="/scholarships" className="inline-flex items-center justify-center bg-primary-400 text-ink-950 px-8 py-3 rounded-full font-semibold hover:bg-primary-300 transition-colors">
              Tìm học bổng ngay
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {saved.map((item) => (
              <ScholarshipCard key={item.id} scholarship={item.scholarship} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SavedPage;
