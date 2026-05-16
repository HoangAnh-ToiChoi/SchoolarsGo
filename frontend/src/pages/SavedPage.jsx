import { Heart } from 'lucide-react';
import { useSavedScholarships } from '../hooks/useScholarship';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { EmptyState } from '../components/ui';

const SavedPage = () => {
  const { data, isLoading } = useSavedScholarships();

  if (isLoading) return <LoadingSpinner />;

  const saved = data?.data || [];

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-danger-300 fill-danger-300" />
            </div>
            <div>
              <h1 className="text-heading-2 font-bold text-white">Học bổng đã lưu</h1>
              <p className="text-primary-200 text-body-sm mt-0.5">
                {saved.length > 0
                  ? `${saved.length} học bổng đang theo dõi`
                  : 'Chưa có học bổng nào được lưu'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saved.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Chưa lưu học bổng nào"
            description="Browse danh sách và nhấn icon trái tim để lưu"
            actionLabel="Tìm học bổng"
            actionTo="/scholarships"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {saved.map((item, i) => (
              <ScholarshipCard key={item.id} scholarship={item.scholarship} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPage;
