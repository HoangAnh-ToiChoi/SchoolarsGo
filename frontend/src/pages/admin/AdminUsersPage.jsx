import { useState } from 'react';
import { Search, Shield, ShieldOff, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus } from '../../hooks/useAdmin';
import { cn, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả role' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã vô hiệu' },
];

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
      </td>
    ))}
  </tr>
);

const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const filters = { page, limit: 20, ...(search && { search }), ...(role && { role }), ...(status && { status }) };
  const { data, isLoading, error } = useAdminUsers(filters);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  const users = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleRoleChange = (userId, newRole) => {
    if (!window.confirm(`Đổi role thành "${newRole}"?`)) return;
    updateRole.mutate({ id: userId, role: newRole });
  };

  const handleStatusToggle = (user) => {
    const action = user.is_active ? 'vô hiệu hóa' : 'kích hoạt';
    if (!window.confirm(`Bạn muốn ${action} tài khoản này?`)) return;
    updateStatus.mutate({ id: user.id, isActive: !user.is_active });
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Quản lý người dùng</h1>
        <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
          {meta.total > 0 ? `${meta.total} người dùng` : 'Danh sách người dùng'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo email hoặc tên..."
              className="input w-full pl-9"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Tìm
          </button>
        </form>
        <div className="flex gap-2">
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="input">
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        {error ? (
          <div className="p-12 text-center text-rose-500 dark:text-rose-400">
            Không thể tải dữ liệu. Kiểm tra quyền admin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Đăng ký</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-gray-400 dark:text-white/30 italic">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{user.full_name || '—'}</p>
                        <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">{user.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          user.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60'
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          user.is_active
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40'
                        )}>
                          {user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 dark:text-white/50 text-xs">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.role === 'user' ? (
                            <button
                              onClick={() => handleRoleChange(user.id, 'admin')}
                              disabled={updateRole.isPending}
                              title="Nâng lên Admin"
                              className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors disabled:opacity-40"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(user.id, 'user')}
                              disabled={updateRole.isPending}
                              title="Hạ xuống User"
                              className="p-1.5 rounded-lg text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusToggle(user)}
                            disabled={updateStatus.isPending}
                            title={user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors disabled:opacity-40',
                              user.is_active
                                ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                                : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                            )}
                          >
                            {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-white/40">
              Trang {meta.page} / {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
