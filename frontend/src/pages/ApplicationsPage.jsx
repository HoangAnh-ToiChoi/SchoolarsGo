import { Link } from 'react-router-dom';
import { useState } from 'react';
import { BookOpen, ChevronRight, CheckCircle, Circle, Calendar, Filter } from 'lucide-react';
import { useApplications, useUpdateApplication } from '../hooks/useApplication';
import { cn, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, EmptyState, Button, Select, Card, CardContent } from '../components/ui';

const ApplicationsPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useApplications(statusFilter ? { status: statusFilter } : {});
  const updateApplication = useUpdateApplication();

  if (isLoading) return <LoadingSpinner />;

  const applications = data?.data || [];

  const handleChecklistToggle = (applicationId, itemIndex) => {
    const application = applications.find(app => app.id === applicationId);
    if (!application) return;

    const updatedChecklist = [...application.checklist];
    updatedChecklist[itemIndex] = {
      ...updatedChecklist[itemIndex],
      done: !updatedChecklist[itemIndex].done
    };

    updateApplication.mutate({
      id: applicationId,
      checklist: updatedChecklist
    });
  };

  const handleStatusChange = (applicationId, newStatus) => {
    updateApplication.mutate({
      id: applicationId,
      status: newStatus
    });
  };

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'draft', label: 'Nháp' },
    { value: 'submitted', label: 'Đã nộp' },
    { value: 'under_review', label: 'Đang xét duyệt' },
    { value: 'interview', label: 'Phỏng vấn' },
    { value: 'accepted', label: 'Được chấp nhận' },
    { value: 'rejected', label: 'Bị từ chối' },
    { value: 'withdrawn', label: 'Đã rút' },
  ];

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

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-body-sm font-medium text-gray-700">Lọc:</span>
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-48"
        />
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có đơn ứng tuyển nào"
          description="Bắt đầu tìm kiếm và ứng tuyển học bổng ngay"
          actionLabel="Tìm học bổng"
          actionTo="/scholarships"
        />
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <Card key={app.id} className="overflow-hidden">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      to={`/scholarships/${app.scholarship_id}`}
                      className="text-heading-4 font-bold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {app.scholarship?.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-2 text-body-sm text-gray-600">
                      <span>{app.scholarship?.country}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {app.applied_at ? formatDate(app.applied_at) : 'Chưa nộp'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      options={statusOptions.slice(1)} // Remove "Tất cả" option
                      value={app.status}
                      onChange={(value) => handleStatusChange(app.id, value)}
                      className="w-40"
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="mb-4">
                  <h4 className="text-body font-medium text-gray-900 mb-3">Danh sách kiểm tra:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {app.checklist?.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleChecklistToggle(app.id, index)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        {item.done ? (
                          <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={cn(
                          'text-body-sm',
                          item.done ? 'text-gray-600 line-through' : 'text-gray-900'
                        )}>
                          {item.item}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-caption text-gray-500">
                    Cập nhật: {formatDate(app.updated_at)}
                  </div>
                  <Link
                    to={`/scholarships/${app.scholarship_id}`}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-800 text-body-sm font-medium"
                  >
                    Xem chi tiết
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
