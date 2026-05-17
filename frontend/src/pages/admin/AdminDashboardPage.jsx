import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Users, BookOpen, FileText, TrendingUp, Star } from 'lucide-react';
import { useAdminStats, useAdminChartStats } from '../../hooks/useAdmin';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_COLORS = {
  draft: '#94a3b8',
  submitted: '#60a5fa',
  under_review: '#fbbf24',
  interview: '#a78bfa',
  accepted: '#34d399',
  rejected: '#f87171',
  withdrawn: '#6b7280',
};

const STATUS_LABELS = {
  draft: 'Nháp',
  submitted: 'Đã nộp',
  under_review: 'Xét duyệt',
  interview: 'Phỏng vấn',
  accepted: 'Được nhận',
  rejected: 'Từ chối',
  withdrawn: 'Đã rút',
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-[0_0_20px_rgba(168,85,247,0.05)]">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {sub !== undefined && (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
          +{sub} tuần này
        </span>
      )}
    </div>
    <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">{value ?? '—'}</p>
    <p className="text-sm text-gray-500 dark:text-white/50">{label}</p>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 animate-pulse">
    <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-white/10 mb-4" />
    <div className="h-8 w-20 bg-gray-200 dark:bg-white/10 rounded mb-2" />
    <div className="h-4 w-32 bg-gray-100 dark:bg-white/5 rounded" />
  </div>
);

const AdminDashboardPage = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  const { data: chart, isLoading: chartLoading } = useAdminChartStats();

  const appByStatus = chart?.applicationsByStatus?.map((r) => ({
    name: STATUS_LABELS[r.status] || r.status,
    value: parseInt(r.count, 10),
    status: r.status,
  })) || [];

  const regByWeek = chart?.userRegistrationsByWeek?.map((r) => ({
    week: r.week,
    count: parseInt(r.count, 10),
  })) || [];

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-white/50 mt-1">Tổng quan hệ thống ScholarsGo</p>
      </div>

      {statsError && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm">
          Không thể tải dữ liệu thống kê. Kiểm tra quyền admin.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={Users} label="Tổng người dùng" value={stats?.totalUsers} sub={stats?.newUsersThisWeek} color="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400" />
            <StatCard icon={BookOpen} label="Tổng học bổng" value={stats?.totalScholarships} color="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400" />
            <StatCard icon={Star} label="Học bổng còn hạn" value={stats?.activeScholarships} color="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" />
            <StatCard icon={FileText} label="Tổng đơn ứng tuyển" value={stats?.totalApplications} color="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={TrendingUp} label="Đơn được nhận" value={stats?.applicationsByStatus?.accepted ?? 0} color="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User registrations */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5">Đăng ký mới theo tuần</h2>
          {chartLoading ? (
            <div className="h-56 flex items-center justify-center"><LoadingSpinner /></div>
          ) : regByWeek.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 dark:text-white/30 text-sm italic">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={regByWeek} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  labelStyle={{ color: '#c4b5fd' }}
                />
                <Area type="monotone" dataKey="count" name="Đăng ký" stroke="#a855f7" strokeWidth={2} fill="url(#colorCount)" dot={{ r: 3, fill: '#a855f7' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Applications by status */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5">Đơn ứng tuyển theo trạng thái</h2>
          {chartLoading ? (
            <div className="h-56 flex items-center justify-center"><LoadingSpinner /></div>
          ) : appByStatus.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 dark:text-white/30 text-sm italic">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={appByStatus} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                />
                <Bar dataKey="value" name="Số đơn" radius={[6, 6, 0, 0]}>
                  {appByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
