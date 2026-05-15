import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookmarkIcon,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useApplications } from '../hooks/useApplication';
import { useSavedScholarships } from '../hooks/useScholarship';
import { useScholarships } from '../hooks/useScholarship';
import { cn, formatDate, getStatusColor, getStatusLabel, formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, EmptyState, Button, Card, CardContent, Badge } from '../components/ui';
import { AuroraBackground } from '../components/landing/AuroraBackground';
import AnimatedPage from '../components/ui/AnimatedPage';

const DashboardPage = () => {
  const navigate = useNavigate();

  // Fetch all data in parallel
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: appData, isLoading: appsLoading } = useApplications();
  const { data: saved, isLoading: savedLoading } = useSavedScholarships();
  const { data: scholarshipsData, isLoading: scholarshipsLoading } = useScholarships();

  const isLoading = profileLoading || appsLoading || savedLoading || scholarshipsLoading;

  // Calculate profile completion percentage
  const profileFields = ['full_name', 'date_of_birth', 'phone', 'gpa', 'target_degree', 'english_level'];
  const completedFields = profileFields.filter(field => profile?.[field]).length;
  const completionPercent = Math.round((completedFields / profileFields.length) * 100);

  // Get applications and scholarships
  const applications = appData?.data || [];
  const scholarships = scholarshipsData?.data || [];

  // Filter upcoming deadlines (next 30 days)
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const upcomingDeadlines = scholarships
    .filter(s => {
      const deadline = new Date(s.deadline);
      return deadline <= thirtyDaysLater && deadline > new Date();
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  // Calculate status breakdown
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});

  // Get recent applications (5 most recent)
  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Metrics data
  const metrics = [
    {
      id: 'total-apps',
      label: 'Tổng đơn ứng tuyển',
      value: applications.length,
      icon: ClipboardCheck,
      color: 'text-blue-600',
    },
    {
      id: 'saved-scholarships',
      label: 'Học bổng đã lưu',
      value: saved?.length ?? 0,
      icon: BookmarkIcon,
      color: 'text-amber-600',
    },
    {
      id: 'profile-completion',
      label: 'Hoàn thành profile',
      value: `${completionPercent}%`,
      icon: ClipboardCheck,
      color: 'text-green-600',
    },
    {
      id: 'upcoming-deadlines',
      label: 'Sắp tới hạn',
      value: upcomingDeadlines.length,
      icon: AlertCircle,
      color: 'text-red-600',
    },
  ];

  // Status badge colors
  const statusColors = {
    draft: 'gray',
    submitted: 'blue',
    under_review: 'amber',
    interview: 'purple',
    accepted: 'green',
    rejected: 'rose',
    withdrawn: 'gray',
  };

  const statusLabels = {
    draft: 'Nháp',
    submitted: 'Đã nộp',
    under_review: 'Đang xét duyệt',
    interview: 'Phỏng vấn',
    accepted: 'Được chấp nhận',
    rejected: 'Bị từ chối',
    withdrawn: 'Đã rút',
  };

  // Helper to get days until deadline
  const getDaysUntil = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getBorderColor = (deadline) => {
    const daysUntil = getDaysUntil(deadline);
    if (daysUntil <= 7) return 'border-l-4 border-l-red-500';
    if (daysUntil <= 14) return 'border-l-4 border-l-amber-500';
    return 'border-l-4 border-l-gray-300';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AnimatedPage className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white pb-24">
      <AuroraBackground />

      <div className="container-page relative z-10 pt-24 md:pt-32 mb-12 space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Dashboard"
          description="Tổng quan về hoạt động ứng tuyển của bạn"
        />

        {/* Section 1: Metrics Cards */}
      <section>
        <h2 className="text-heading-3 mb-4">Tổng quan</h2>
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map(metric => {
            const Icon = metric.icon;
            return (
              <Card key={metric.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-white/60 mb-2">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                    </div>
                    <Icon className={cn('w-8 h-8', metric.color)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Section 2: Quick Actions */}
      <section>
        <h2 className="text-heading-3 mb-4">Hành động nhanh</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            fullWidth
            onClick={() => navigate('/scholarships')}
            className="justify-center"
          >
            Tìm học bổng mới
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate('/profile#documents')}
            className="justify-center"
          >
            Tải tài liệu lên
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate('/profile')}
            className="justify-center"
          >
            Hoàn thiện profile
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate('/applications')}
            className="justify-center"
          >
            Xem tất cả ứng tuyển
          </Button>
        </div>
      </section>

      {/* Section 3: Application Status Breakdown */}
      {applications.length > 0 && (
        <section>
          <h2 className="text-heading-3 mb-4">Phân bố trạng thái</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <div key={status} className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {statusCounts[status] ?? 0}
                    </p>
                    <Badge color={statusColors[status]} className="w-full justify-center">
                      {label}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Section 4: Recent Applications Timeline */}
      {recentApplications.length > 0 ? (
        <section>
          <h2 className="text-heading-3 mb-4">Ứng tuyển gần đây</h2>
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Circle className="w-2 h-2 flex-shrink-0 text-primary-600" />
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {app.scholarship?.title || 'Không xác định'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-white/60 mb-3">
                        Ứng tuyển lúc: {formatDate(app.created_at, 'dd/MM/yyyy HH:mm')}
                      </p>
                      <Badge color={statusColors[app.status]}>
                        {statusLabels[app.status]}
                      </Badge>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-white/30 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Section 5: Upcoming Deadlines Alert */}
      {upcomingDeadlines.length > 0 ? (
        <section>
          <h2 className="text-heading-3 mb-4">Sắp tới hạn</h2>
          <div className="space-y-3">
            {upcomingDeadlines.map(scholarship => {
              const daysUntil = getDaysUntil(scholarship.deadline);
              const borderColorClass = getBorderColor(scholarship.deadline);

              return (
                <Card key={scholarship.id} className={borderColorClass}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle
                            className={cn(
                              'w-5 h-5 flex-shrink-0',
                              daysUntil <= 7
                                ? 'text-red-500'
                                : daysUntil <= 14
                                  ? 'text-amber-500'
                                  : 'text-gray-400'
                            )}
                          />
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {scholarship.title}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-white/60 mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {scholarship.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDate(scholarship.deadline, 'dd/MM/yyyy')}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-4 h-4" />
                            {daysUntil} ngày
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Empty State */}
      {applications.length === 0 && (
        <div className="text-center py-12">
          <EmptyState
            icon={TrendingUp}
            title="Chưa có dữ liệu"
            description="Hoàn thiện profile và tạo ứng tuyển để xem thống kê chi tiết."
            actionLabel="Tìm học bổng"
            actionTo="/scholarships"
          />
        </div>
      )}
      </div>
    </AnimatedPage>
  );
};

export default DashboardPage;
