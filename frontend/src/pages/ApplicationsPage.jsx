import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useApplications } from '../hooks/useApplication';
import { cn, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, EmptyState, Button } from '../components/ui';

const ApplicationsPage = () => {
  const { data, isLoading } = useApplications();

  if (isLoading) return <LoadingSpinner />;

  const applications = data?.data || [];

  return (
    <div className="container-narrow py-8">
      <PageHeader
        title="Đơn ứng tuyển"
        description="Theo dõi tiến độ các đơn ứng tuyển của bạn"
        actions={
          <Link to="/scholarships" className="btn-primary">
            <BookOpen className="w-5 h-5" />Tìm học bổng
          </Link>
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có đơn ứng tuyển nào"
          description="Bắt đầu tìm kiếm và ứng tuyển học bổng ngay"
          actionLabel="Tìm học bổng"
          actionTo="/scholarships"
        />
      ) : (
        <div className="space-y-3 md:space-y-4">
          {applications.map((app) => (
            <Link key={app.id} to={`/scholarships/${app.scholarship_id}`} className="block card-hover p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between md:gap-4 gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm md:text-base">{app.scholarship?.title}</h3>
                  <p className="text-body-sm text-gray-500 line-clamp-1">{app.scholarship?.country} • Nộp: {app.applied_at ? formatDate(app.applied_at) : '—'}</p>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
                  <span className={cn('badge text-xs md:text-sm whitespace-nowrap', getStatusColor(app.status))}>{getStatusLabel(app.status)}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
