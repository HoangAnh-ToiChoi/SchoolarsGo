import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader, EmptyState } from '~/components/legacy';
import MetricGrid from '~/pages/dashboard/components/metricGrid';
import QuickActions from '~/pages/dashboard/components/quickActions';
import RecentApplications from '~/pages/dashboard/components/recentApplications';
import StatusBreakdown from '~/pages/dashboard/components/statusBreakdown';
import UpcomingDeadlines from '~/pages/dashboard/components/upcomingDeadlines';
import { ROUTES } from '~/utils/routes';

export default function OverviewTab({ data, onOpenProfile }) {
  const { applications, stats, statusCounts, recentApplications, upcomingDeadlines, now } = data;
  const hasApplications = applications.length > 0;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mb-12 space-y-8">
        <PageHeader title="Dashboard" description="Tổng quan về hoạt động ứng tuyển của bạn" />
        <MetricGrid stats={stats} />
        <QuickActions onOpenProfile={onOpenProfile} />
        {hasApplications && <StatusBreakdown statusCounts={statusCounts} />}
        {recentApplications.length > 0 && <RecentApplications applications={recentApplications} />}
        {upcomingDeadlines.length > 0 && <UpcomingDeadlines scholarships={upcomingDeadlines} now={now} />}
        {!hasApplications && (
          <div className="text-center py-12">
            <EmptyState
              icon={TrendingUp}
              title="Chưa có dữ liệu"
              description="Hoàn thiện profile và tạo ứng tuyển để xem thống kê chi tiết."
              actionLabel="Tìm học bổng"
              actionTo={ROUTES.home}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
