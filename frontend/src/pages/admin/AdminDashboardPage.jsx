import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Users, BookOpen, FileText, TrendingUp, Star } from 'lucide-react';
import { useAdminStats, useAdminChartStats } from '../../hooks/useAdmin';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_COLORS = {
  draft: '#6E7681',
  submitted: '#60a5fa',
  under_review: '#fbbf24',
  interview: '#a78bfa',
  accepted: '#34d399',
  rejected: '#f87171',
  withdrawn: '#8B949E',
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
  <div className="card">
    <div className="card-body">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {sub !== undefined && (
          <span className="badge-success">+{sub} tuần này</span>
        )}
      </div>
      <p className="text-3xl font-extrabold text-ink-100 mb-1">{value ?? '—'}</p>
      <p className="text-sm text-ink-400">{label}</p>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="card-body">
      <div className="w-11 h-11 rounded-xl bg-ink-800 mb-4" />
      <div className="h-8 w-20 bg-ink-800 rounded mb-2" />
      <div className="h-4 w-32 bg-ink-700 rounded" />
    </div>
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
        <h1 className="text-heading-1 text-ink-100">Dashboard</h1>
        <p className="text-body-sm text-ink-400 mt-1">Tổng quan hệ thống ScholarsGo</p>
      </div>

      {statsError && (
        <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/20 rounded-card text-danger-400 text-sm">
          Không thể tải dữ liệu thống kê. Kiểm tra quyền admin.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={Users}     label="Tổng người dùng"     value={stats?.totalUsers}          sub={stats?.newUsersThisWeek} color="bg-primary-400/10 text-primary-400" />
            <StatCard icon={BookOpen}  label="Tổng học bổng"        value={stats?.totalScholarships}   color="bg-warning-400/10 text-warning-400" />
            <StatCard icon={Star}      label="Học bổng còn hạn"     value={stats?.activeScholarships}  color="bg-warning-500/10 text-warning-500" />
            <StatCard icon={FileText}  label="Tổng đơn ứng tuyển"   value={stats?.totalApplications}   color="bg-success-400/10 text-success-400" />
            <StatCard icon={TrendingUp} label="Đơn được nhận"       value={stats?.applicationsByStatus?.accepted ?? 0} color="bg-success-500/10 text-success-500" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User registrations */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-base font-bold text-ink-100 mb-5">Đăng ký mới theo tuần</h2>
            {chartLoading ? (
              <div className="h-56 flex items-center justify-center"><LoadingSpinner /></div>
            ) : regByWeek.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-ink-500 text-sm italic">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={regByWeek} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22D3EE" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,118,129,0.15)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6E7681' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6E7681' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: 8, color: '#E6EDF3', fontSize: 13 }}
                    labelStyle={{ color: '#22D3EE' }}
                  />
                  <Area type="monotone" dataKey="count" name="Đăng ký" stroke="#22D3EE" strokeWidth={2} fill="url(#colorCount)" dot={{ r: 3, fill: '#22D3EE' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Applications by status */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-base font-bold text-ink-100 mb-5">Đơn ứng tuyển theo trạng thái</h2>
            {chartLoading ? (
              <div className="h-56 flex items-center justify-center"><LoadingSpinner /></div>
            ) : appByStatus.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-ink-500 text-sm italic">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={appByStatus} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,118,129,0.15)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6E7681' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6E7681' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: 8, color: '#E6EDF3', fontSize: 13 }}
                  />
                  <Bar dataKey="value" name="Số đơn" radius={[6, 6, 0, 0]}>
                    {appByStatus.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6E7681'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
