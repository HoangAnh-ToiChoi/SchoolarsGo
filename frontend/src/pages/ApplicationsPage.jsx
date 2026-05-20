import { Link } from 'react-router-dom';
import { useState } from 'react';
import { BookOpen, ChevronRight, CheckCircle, Circle, Calendar, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApplications, useUpdateApplication } from '../hooks/useApplication';
import { cn, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { Select } from '../components/ui';

const ApplicationsPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useApplications(statusFilter ? { status: statusFilter } : {});
  const updateApplication = useUpdateApplication();

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-screen bg-ink-950 pb-24">
      <div className="container-page pt-10 mb-12">
        <div className="text-center mb-12 relative">
          <div className="absolute right-0 top-0 hidden md:block">
            <Link to="/scholarships" className="inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 border border-ink-800 text-ink-200 px-5 py-2.5 rounded-full font-medium transition-all">
              <BookOpen className="w-4 h-4" />Tìm học bổng
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-ink-800 bg-ink-900 px-4 py-1.5 text-sm text-ink-300 mb-5">
            <BookOpen className="w-4 h-4 text-primary-400" />
            <span>Quản lý hồ sơ</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-100 mb-4">
            Đơn Ứng Tuyển
          </h1>
          <p className="text-ink-400 max-w-2xl mx-auto">
            Theo dõi tiến độ và quản lý checklist các đơn ứng tuyển của bạn.
          </p>
        </div>

        <div className="mb-8 flex items-center gap-4 bg-ink-900 border border-ink-800 rounded-card p-4 w-fit mx-auto md:mx-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ink-500" />
            <span className="text-sm font-medium text-ink-300">Lọc:</span>
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-48"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center"><LoadingSpinner /></div>
        ) : applications.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-ink-900 border border-ink-800 rounded-card p-12 text-center">
            <div className="w-20 h-20 bg-ink-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-ink-500" />
            </div>
            <h2 className="text-2xl font-bold text-ink-100 mb-4">Chưa có đơn ứng tuyển nào</h2>
            <p className="text-ink-400 text-lg mb-8">
              Bắt đầu tìm kiếm và ứng tuyển học bổng ngay hôm nay.
            </p>
            <Link
              to="/scholarships"
              className="inline-flex items-center gap-2 bg-primary-400 text-ink-950 px-8 py-3 rounded-full font-semibold hover:bg-primary-300 transition-colors"
            >
              Tìm học bổng để ứng tuyển
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) =>{
              if(!app.scholarship) return null;
            return (
              <div key={app.id} className="overflow-hidden bg-ink-900 border border-ink-800 rounded-card p-6 transition-all hover:border-ink-700">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                  <div className="flex-1">
                    <Link
                      to={`/scholarships/${app.scholarship?.id}`}
                      className="text-2xl font-bold text-ink-100 hover:text-primary-400 transition-colors"
                    >
                      {app.scholarship?.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-2 text-sm text-ink-400">
                      <span className="bg-ink-800 border border-ink-700 px-3 py-1 rounded-full">{app.scholarship?.country}</span>
                      <div className="flex items-center gap-1.5 bg-ink-800 border border-ink-700 px-3 py-1 rounded-full">
                        <Calendar className="w-4 h-4 text-primary-400" />
                        Deadline: {app.applied_at ? formatDate(app.applied_at) : 'Chưa nộp'}
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-auto">
                    <Select
                      options={statusOptions.slice(1)}
                      value={app.status}
                      onChange={(value) => handleStatusChange(app.id, value)}
                      className="w-full md:w-48"
                    />
                  </div>
                </div>

                <div className="mb-6 bg-ink-950 rounded-card p-5 border border-ink-800">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-400 mb-4">Danh sách kiểm tra:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {app.checklist?.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleChecklistToggle(app.id, index)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-ink-800 transition-colors text-left border border-transparent hover:border-ink-700"
                      >
                        {item.done ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-ink-600 flex-shrink-0" />
                        )}
                        <span className={cn(
                          'text-sm font-medium transition-all',
                          item.done ? 'text-ink-500 line-through' : 'text-ink-200'
                        )}>
                          {item.item}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-ink-800">
                  <div className="text-xs text-ink-500 font-medium tracking-wide uppercase">
                    Cập nhật: {formatDate(app.updated_at)}
                  </div>
                  <Link
                    to={`/scholarships/${app.scholarship?.id}`}
                    className="flex items-center gap-2 text-primary-400 hover:text-primary-400 text-sm font-semibold bg-primary-400/10 px-4 py-2 rounded-full transition-all hover:bg-primary-400/15"
                  >
                    Xem chi tiết
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ApplicationsPage;
