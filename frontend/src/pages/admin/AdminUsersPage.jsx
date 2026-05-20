import { useState } from 'react';
import { Search, Shield, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedItem from '../../components/ui/AnimatedItem';
import { useAdminUsers, useUpdateUserRole } from '../../hooks/useAdmin';
import { cn, formatDate } from '../../utils/helpers';

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả role' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-4 bg-ink-800 rounded w-3/4" />
      </td>
    ))}
  </tr>
);

const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');

  const filters = { page, limit: 20, ...(search && { search }), ...(role && { role }) };
  const { data, isLoading, error } = useAdminUsers(filters);
  const updateRole = useUpdateUserRole();

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

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink-100">Quản lý người dùng</h1>
        <p className="text-sm text-ink-400 mt-1">
          {meta.total > 0 ? `${meta.total} người dùng` : 'Danh sách người dùng'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo email hoặc tên..."
              className="input w-full pl-9"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-400 hover:bg-primary-300 text-ink-950 rounded-xl text-sm font-semibold transition-colors">
            Tìm
          </button>
        </form>
        <div className="flex gap-2">
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="input">
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl shadow-sm overflow-hidden">
        {error ? (
          <div className="p-12 text-center text-danger-400">
            Không thể tải dữ liệu. Kiểm tra quyền admin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">Đăng ký</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-400">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center text-ink-500 italic">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <AnimatedItem key={user.id} as="tr" standalone className="hover:bg-ink-800 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-ink-100">{user.full_name || '—'}</p>
                        <p className="text-xs text-ink-400 mt-0.5">{user.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                          user.role === 'admin'
                            ? 'bg-primary-400/10 text-primary-400 border-primary-400/20'
                            : 'bg-ink-800 text-ink-300 border-ink-700'
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-ink-400 text-xs">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.role === 'user' ? (
                            <button
                              onClick={() => handleRoleChange(user.id, 'admin')}
                              disabled={updateRole.isPending}
                              title="Nâng lên Admin"
                              className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-400/10 transition-colors disabled:opacity-40"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(user.id, 'user')}
                              disabled={updateRole.isPending}
                              title="Hạ xuống User"
                              className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-800 transition-colors disabled:opacity-40"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </AnimatedItem>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-ink-800">
            <p className="text-sm text-ink-400">
              Trang {meta.page} / {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg border border-ink-800 text-ink-300 hover:bg-ink-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg border border-ink-800 text-ink-300 hover:bg-ink-800 disabled:opacity-40 transition-colors"
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
