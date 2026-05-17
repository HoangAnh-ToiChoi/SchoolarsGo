import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useApplications } from '../hooks/useApplication';
import { cn, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, EmptyState } from '../components/ui';

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
        <>
          {(() => {
            const counts = {
              total: applications.length,
              pending: applications.filter(a => ['submitted', 'under_review', 'interview'].includes(a.status)).length,
              accepted: applications.filter(a => a.status === 'accepted').length,
              rejected: applications.filter(a => ['rejected', 'withdrawn'].includes(a.status)).length,
            };
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Tổng đơn', value: counts.total, color: 'text-primary-600 bg-primary-50' },
                  { label: 'Đang xử lý', value: counts.pending, color: 'text-warning-600 bg-warning-50' },
                  { label: 'Được nhận', value: counts.accepted, color: 'text-success-600 bg-success-50' },
                  { label: 'Không đậu', value: counts.rejected, color: 'text-danger-600 bg-danger-50' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card card-body py-4 text-center">
                    <p className={`text-2xl font-extrabold ${color.split(' ')[0]}`}>{value}</p>
                    <p className="text-body-sm text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            );
          })()}
          {/* Analytics */}
          <div className="card card-body mb-6">
            <h3 className="text-heading-3 text-gray-900 mb-5">Phân bố trạng thái</h3>
            <div className="space-y-3">
              {[
                { key: 'draft', label: 'Nháp', color: 'bg-gray-400' },
                { key: 'submitted', label: 'Đã nộp', color: 'bg-blue-400' },
                { key: 'under_review', label: 'Đang xét', color: 'bg-primary-500' },
                { key: 'interview', label: 'Phỏng vấn', color: 'bg-secondary-500' },
                { key: 'accepted', label: 'Được nhận', color: 'bg-success-500' },
                { key: 'rejected', label: 'Từ chối', color: 'bg-danger-500' },
                { key: 'withdrawn', label: 'Đã rút', color: 'bg-gray-300' },
              ]
                .map((s) => ({ ...s, count: applications.filter((a) => a.status === s.key).length }))
                .filter((s) => s.count > 0)
                .map(({ label, color, count }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-body-sm text-gray-600 w-28 shrink-0">{label}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${(count / applications.length) * 100}%` }} />
                    </div>
                    <span className="text-body-sm font-semibold text-gray-700 w-6 text-right">{count}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="space-y-4">
            {applications.map((app) => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className={cn(
                  'block card card-body py-4 cursor-pointer hover:shadow-card-hover transition-all',
                  app.status === 'accepted' && 'border-l-4 border-l-success-500',
                  app.status === 'rejected' && 'border-l-4 border-l-danger-500',
                  ['submitted', 'under_review', 'interview'].includes(app.status) && 'border-l-4 border-l-warning-500'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{app.scholarship?.title}</h3>
                    <p className="text-body-sm text-gray-500">{app.scholarship?.country} • Nộp: {app.applied_at ? formatDate(app.applied_at) : '—'}</p>
                    {app.notes && <p className="text-body-sm text-gray-600 mt-1 line-clamp-1">{app.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn('badge', getStatusColor(app.status))}>{getStatusLabel(app.status)}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ApplicationsPage;
