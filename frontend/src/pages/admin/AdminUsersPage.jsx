import { useState } from 'react';
import { Search, Shield, ShieldOff, ChevronLeft, ChevronRight, Lock, Unlock } from 'lucide-react';
import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus } from '../../hooks/useAdmin';
import { cn, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/ui/Modal';

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
  const [status, setStatus] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, user: null });

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
    setConfirmModal({ open: true, user });
  };

  const handleConfirmStatus = () => {
    const { user } = confirmModal;
    updateStatus.mutate({ id: user.id, isActive: !user.is_active });
    setConfirmModal({ open: false, user: null });
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-heading-1 text-ink-100">Quản lý người dùng</h1>
        <p className="text-body-sm text-ink-400 mt-1">
          {meta.total > 0 ? `${meta.total} người dùng` : 'Danh sách người dùng'}
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo email hoặc tên..."
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn-primary btn-sm">Tìm</button>
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
      <div className="card overflow-hidden">
        {error ? (
          <div className="p-12 text-center text-danger-400">
            Không thể tải dữ liệu. Kiểm tra quyền admin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800">
                  <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-ink-500">Người dùng</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-ink-500">Role</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-ink-500">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-ink-500">Đăng ký</th>
                  <th className="px-4 py-3 text-right text-caption font-semibold uppercase tracking-wider text-ink-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-ink-500 italic">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-ink-800/40 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-ink-100">{user.full_name || '—'}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{user.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          user.role === 'admin' ? 'badge-primary' : 'badge-default'
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          user.is_active !== false ? 'badge-success' : 'badge-default'
                        )}>
                          {user.is_active === false ? 'Vô hiệu' : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-ink-500 text-xs">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {user.role === 'user' ? (
                            <button
                              onClick={() => handleRoleChange(user.id, 'admin')}
                              disabled={updateRole.isPending}
                              title="Nâng lên Admin"
                              className="p-1.5 rounded-button text-primary-400 hover:bg-primary-400/10 transition-colors disabled:opacity-40"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(user.id, 'user')}
                              disabled={updateRole.isPending}
                              title="Hạ xuống User"
                              className="p-1.5 rounded-button text-ink-400 hover:bg-ink-800 transition-colors disabled:opacity-40"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusToggle(user)}
                            disabled={updateStatus.isPending}
                            className={cn(
                              'flex items-center gap-1 px-2 py-1 rounded-button text-xs font-medium transition-colors disabled:opacity-40',
                              user.is_active !== false
                                ? 'text-danger-500 hover:bg-danger-500/10'
                                : 'text-success-500 hover:bg-success-500/10'
                            )}
                          >
                            {user.is_active !== false
                              ? <><Lock className="w-3.5 h-3.5" /> Khóa</>
                              : <><Unlock className="w-3.5 h-3.5" /> Mở</>
                            }
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-ink-800">
            <p className="text-sm text-ink-500">
              Trang {meta.page} / {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-button border border-ink-800 text-ink-400 hover:bg-ink-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-button border border-ink-800 text-ink-400 hover:bg-ink-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm status modal */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, user: null })}
        title={confirmModal.user?.is_active !== false ? 'Khóa tài khoản' : 'Mở tài khoản'}
        description={
          confirmModal.user?.is_active !== false
            ? `Tài khoản "${confirmModal.user?.full_name || confirmModal.user?.email}" sẽ bị khóa và không thể đăng nhập.`
            : `Tài khoản "${confirmModal.user?.full_name || confirmModal.user?.email}" sẽ được mở lại.`
        }
      >
        <div className="flex justify-end gap-3 mt-6 pb-2">
          <button
            onClick={() => setConfirmModal({ open: false, user: null })}
            className="btn-secondary btn-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmStatus}
            disabled={updateStatus.isPending}
            className={cn(
              'btn-sm disabled:opacity-40',
              confirmModal.user?.is_active !== false ? 'btn-danger' : 'btn-primary'
            )}
          >
            {confirmModal.user?.is_active !== false ? 'Khóa' : 'Mở tài khoản'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
