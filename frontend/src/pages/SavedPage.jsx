import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useSavedScholarships } from '../hooks/useScholarship';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';

const SavedPage = () => {
  const { data, isLoading } = useSavedScholarships();

  if (isLoading) return <LoadingSpinner />;

  const saved = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Học bổng đã lưu</h1>
        <p className="text-gray-600">Danh sách học bổng bạn đã bookmark để theo dõi</p>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Chưa lưu học bổng nào</h3>
          <p className="text-gray-500 mb-6">Browse danh sách và nhấn icon trái tim để lưu</p>
          <Link to="/scholarships" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700">Tìm học bổng</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map((item) => (
            <ScholarshipCard key={item.id} scholarship={item.scholarship} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPage;
