import { Heart } from 'lucide-react';
import { useSavedScholarships } from '../hooks/useScholarship';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, EmptyState } from '../components/ui';

const SavedPage = () => {
  const { data, isLoading } = useSavedScholarships();

  const saved = data?.data || [];

  return (
    <div className="container-page py-8">
      <PageHeader title="Học bổng đã lưu" description="Danh sách học bổng bạn đã bookmark để theo dõi" />

      {isLoading ? (
        <LoadingSpinner />
      ) : saved.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Chưa lưu học bổng nào"
          description="Khám phá danh sách học bổng và nhấn icon trái tim để lưu những cơ hội yêu thích của bạn."
          actionLabel="Tìm học bổng"
          actionTo="/scholarships"
        />
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {saved.map((item) => (
            <ScholarshipCard key={item.id} scholarship={item.scholarship} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPage;
