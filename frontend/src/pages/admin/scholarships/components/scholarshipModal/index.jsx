import { X } from 'lucide-react';
import ScholarshipFormFields from '~/pages/admin/scholarships/components/scholarshipFormFields';
import { getSaveLabel } from '~/pages/admin/scholarships/helpers';
import { useScholarshipForm } from '~/pages/admin/scholarships/hooks';

export default function ScholarshipModal({ scholarship, onClose, onSave, isSaving }) {
  const { isEdit, form, set, handleSubmit } = useScholarshipForm(scholarship, onSave);
  return (
    <div className="modalOverlay">
      <div className="modalContent max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="modalHeader">
          <h2 className="modalTitle">{isEdit ? 'Chỉnh sửa học bổng' : 'Thêm học bổng mới'}</h2>
          <button onClick={onClose} className="btnGhost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <ScholarshipFormFields form={form} set={set} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btnSecondary">Hủy</button>
            <button type="submit" disabled={isSaving} className="btnPrimary disabled:opacity-50 disabled:cursor-not-allowed">
              {getSaveLabel(isSaving, isEdit)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
