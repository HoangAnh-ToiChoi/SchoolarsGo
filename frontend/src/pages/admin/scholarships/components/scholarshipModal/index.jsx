import ModalFrame from '~/pages/admin/scholarships/components/modalFrame';
import ScholarshipFormFields from '~/pages/admin/scholarships/components/scholarshipFormFields';
import { MODAL_TITLES } from '~/pages/admin/scholarships/constants';
import { getSaveLabel } from '~/pages/admin/scholarships/helpers';
import { useScholarshipForm } from '~/pages/admin/scholarships/hooks';

export default function ScholarshipModal({ scholarship, onClose, onSave, isSaving }) {
  const { isEdit, initial, form, set, handleSubmit } = useScholarshipForm(scholarship, { onSave, onClose });
  return (
    <ModalFrame title={isEdit ? MODAL_TITLES.edit : MODAL_TITLES.create} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <ScholarshipFormFields form={form} set={set} initialCoverage={initial.coverage} />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btnSecondary">Hủy</button>
          <button type="submit" disabled={isSaving} className="btnPrimary disabled:opacity-50 disabled:cursor-not-allowed">
            {getSaveLabel(isSaving, isEdit)}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}
