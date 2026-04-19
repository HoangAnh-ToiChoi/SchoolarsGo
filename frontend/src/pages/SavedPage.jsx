import { Heart } from 'lucide-react';
import { useSavedScholarships } from '../hooks/useScholarship';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, EmptyState } from '../components/ui';

const SavedPage = () => {
  const { data, isLoading } = useSavedScholarships();

  if (isLoading) return <LoadingSpinner />;

  const saved = data?.data || [];
  const normalizedSaved = saved.map((item) => (
    item.scholarship
      ? item
      : {
          ...item,
          scholarship: {
            id: item.scholarship_id,
            title: item.title,
            provider: item.provider,
            country: item.country,
            degree: item.degree,
            amount: item.amount,
            currency: item.currency,
            deadline: item.deadline,
            image_url: item.image_url,
            is_featured: item.is_featured,
            is_saved: true,
          },
        }
  ));

  return (
    <div className="container-page py-8">
      <PageHeader title="Học bổng đã lưu" description="Danh sách học bổng bạn đã bookmark để theo dõi" />

      {normalizedSaved.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Chưa lưu học bổng nào"
          description="Browse danh sách và nhấn icon trái tim để lưu"
          actionLabel="Tìm học bổng"
          actionTo="/scholarships"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {normalizedSaved.map((item) => (
            <ScholarshipCard key={item.id} scholarship={item.scholarship} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPage;
