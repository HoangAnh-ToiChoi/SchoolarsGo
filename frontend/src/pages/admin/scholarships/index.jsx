import { useState } from 'react';
import { Plus } from 'lucide-react';
import AdminPageTitle from '~/components/admin/adminPageTitle';
import AdminTable from '~/components/admin/adminTable';
import { useScholarships } from '~/hooks/useScholarship';
import { ADMIN_PAGE_SIZE, EMPTY_META } from '~/utils/constants';
import ScholarshipModal from '~/pages/admin/scholarships/components/scholarshipModal';
import ScholarshipRow from '~/pages/admin/scholarships/components/scholarshipRow';
import { SCHOLARSHIP_COLUMNS, SCHOLARSHIP_SKELETON_ROWS } from '~/pages/admin/scholarships/constants';
import { useScholarshipActions } from '~/pages/admin/scholarships/hooks';

export default function AdminScholarshipsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useScholarships({ page, limit: ADMIN_PAGE_SIZE });
  const actions = useScholarshipActions();

  const scholarships = data?.data || [];
  const meta = data?.meta || EMPTY_META;

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <AdminPageTitle title="Quản lý học bổng" total={meta.total} unit="học bổng" />
        <button onClick={actions.openCreate} className="btnPrimary">
          <Plus className="w-4 h-4" />
          Thêm học bổng
        </button>
      </div>

      <AdminTable
        columns={SCHOLARSHIP_COLUMNS}
        isLoading={isLoading}
        error={error}
        errorText="Không thể tải dữ liệu."
        skeletonCount={SCHOLARSHIP_SKELETON_ROWS}
        isEmpty={scholarships.length === 0}
        emptyText="Chưa có học bổng nào"
        meta={meta}
        setPage={setPage}
      >
        {scholarships.map((s) => (
          <ScholarshipRow
            key={s.id}
            scholarship={s}
            onToggle={actions.toggle}
            isToggling={actions.isToggling}
            onEdit={actions.openEdit}
            onDelete={actions.remove}
            isDeleting={actions.isDeleting}
          />
        ))}
      </AdminTable>

      {actions.modal && (
        <ScholarshipModal
          scholarship={actions.modal.mode === 'edit' ? actions.modal.scholarship : null}
          onClose={actions.closeModal}
          onSave={actions.save}
          isSaving={actions.isSaving}
        />
      )}
    </div>
  );
}
