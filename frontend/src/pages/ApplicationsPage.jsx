import { Link } from 'react-router-dom';
import { useState } from 'react';
import { BookOpen, ChevronRight, CheckCircle, Circle, Calendar, Filter } from 'lucide-react';
import { useApplications, useUpdateApplication } from '../hooks/useApplication';
import { cn, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { Select } from '../components/ui';
import { AuroraBackground } from '../components/landing/AuroraBackground';

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
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white pb-24">
      <AuroraBackground />

      <div className="container-page relative z-10 pt-24 md:pt-32 mb-12">
        <div className="text-center mb-16 relative">
          <div className="absolute right-0 top-0 hidden md:block">
            <Link to="/scholarships" className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white px-5 py-2.5 rounded-full font-medium transition-all">
              <BookOpen className="w-4 h-4" />Tìm học bổng
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <BookOpen className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-purple-700 dark:text-purple-100">Quản lý hồ sơ</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-white dark:to-white/70">
            Đơn Ứng Tuyển
          </h1>
          <p className="text-gray-600 dark:text-white/70 max-w-2xl mx-auto text-lg md:text-xl font-light">
            Theo dõi tiến độ và quản lý checklist các đơn ứng tuyển của bạn.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md rounded-2xl p-4 w-fit mx-auto md:mx-0 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.05)]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 dark:text-white/50" />
            <span className="text-sm font-medium text-gray-700 dark:text-white/80">Lọc:</span>
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
          <div className="max-w-2xl mx-auto bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center shadow-sm dark:shadow-[0_0_40px_rgba(168,85,247,0.05)]">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-purple-500 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Chưa có đơn ứng tuyển nào</h2>
            <p className="text-gray-500 dark:text-white/60 text-lg mb-8">
              Bắt đầu tìm kiếm và ứng tuyển học bổng ngay hôm nay.
            </p>
            <Link to="/scholarships" className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              Tìm học bổng
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => {
              if (!app.scholarship) return null;
              return (
                <div key={app.id} className="overflow-hidden bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.03)] transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-purple-500/30">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <div className="flex-1">
                      <Link
                        to={`/scholarships/${app.scholarship?.id}`}
                        className="text-2xl font-bold text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        {app.scholarship?.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-white/60">
                        <span className="bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full">{app.scholarship?.country}</span>
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full">
                          <Calendar className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
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

                  {/* Checklist */}
                  <div className="mb-6 bg-gray-50 dark:bg-black/20 rounded-2xl p-5 border border-gray-100 dark:border-white/5">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-purple-600 dark:text-purple-400 mb-4">Danh sách kiểm tra:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {app.checklist?.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleChecklistToggle(app.id, index)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                        >
                          {item.done ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 dark:text-white/20 flex-shrink-0" />
                          )}
                          <span className={cn(
                            'text-sm font-medium transition-all',
                            item.done ? 'text-gray-400 dark:text-white/40 line-through' : 'text-gray-700 dark:text-white/90'
                          )}>
                            {item.item}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-white/10">
                    <div className="text-xs text-gray-400 dark:text-white/40 font-medium tracking-wide uppercase">
                      Cập nhật: {formatDate(app.updated_at)}
                    </div>
                    <Link
                      to={`/applications/${app.id}`}
                      className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-bold bg-cyan-500/10 px-4 py-2 rounded-full transition-all hover:bg-cyan-500/20"
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
    </div>
  );
};

export default ApplicationsPage;
