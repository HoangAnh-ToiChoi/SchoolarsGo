import AdminPageTitle from '~/components/admin/adminPageTitle';
import AdminTable from '~/components/admin/adminTable';
import { useAdminUsers } from '~/hooks/useAdmin';
import StatusConfirmModal from '~/pages/admin/users/components/statusConfirmModal';
import UserFilters from '~/pages/admin/users/components/userFilters';
import UserRow from '~/pages/admin/users/components/userRow';
import { USER_COLUMNS, USER_SKELETON_ROWS } from '~/pages/admin/users/constants';
import { useUserActions, useUserFilters } from '~/pages/admin/users/hooks';

const EMPTY_META = { page: 1, totalPages: 1, total: 0 };

export default function AdminUsersPage() {
  const { filters, setPage, ...filterProps } = useUserFilters();
  const { data, isLoading, error } = useAdminUsers(filters);
  const actions = useUserActions();

  const users = data?.data || [];
  const meta = data?.meta || EMPTY_META;

  return (
    <div className="p-6 lg:p-10">
      <AdminPageTitle title="Quản lý người dùng" total={meta.total} unit="người dùng" className="mb-8" />
      <UserFilters {...filterProps} />

      <AdminTable
        columns={USER_COLUMNS}
        isLoading={isLoading}
        error={error}
        errorText="Không thể tải dữ liệu. Kiểm tra quyền admin."
        skeletonCount={USER_SKELETON_ROWS}
        isEmpty={users.length === 0}
        emptyText="Không tìm thấy người dùng nào"
        meta={meta}
        setPage={setPage}
      >
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            onChangeRole={actions.changeRole}
            isRolePending={actions.isRolePending}
            onToggleStatus={actions.askToggleStatus}
            isStatusPending={actions.isStatusPending}
          />
        ))}
      </AdminTable>

      <StatusConfirmModal
        confirmModal={actions.confirmModal}
        onClose={actions.closeConfirm}
        onConfirm={actions.confirmStatus}
        isPending={actions.isStatusPending}
      />
    </div>
  );
}
