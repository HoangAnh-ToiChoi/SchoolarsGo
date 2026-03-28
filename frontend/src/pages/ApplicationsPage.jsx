import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useApplications } from '../hooks/useApplication';
import { cn, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const ApplicationsPage = () => {
  const { data, isLoading } = useApplications();

  if (isLoading) return <LoadingSpinner />;

  const applications = data?.data || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Đơn ứng tuyển</h1>
          <p className="text-gray-600">Theo dõi tiến độ các đơn ứng tuyển của bạn</p>
        </div>
        <Link to="/scholarships" className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors">
          <BookOpen className="w-5 h-5" />Tìm học bổng
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Chưa có đơn ứng tuyển nào</h3>
          <p className="text-gray-500 mb-6">Bắt đầu tìm kiếm và ứng tuyển học bổng ngay</p>
          <Link to="/scholarships" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700">Tìm học bổng</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Link key={app.id} to={`/scholarships/${app.scholarship_id}`} className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{app.scholarship?.title}</h3>
                  <p className="text-sm text-gray-500">{app.scholarship?.country} • Nộp: {app.applied_at ? formatDate(app.applied_at) : '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(app.status))}>{getStatusLabel(app.status)}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
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
