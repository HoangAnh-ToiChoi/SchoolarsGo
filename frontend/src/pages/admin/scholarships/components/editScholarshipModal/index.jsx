import ModalFrame from '~/pages/admin/scholarships/components/modalFrame';
import ScholarshipModal from '~/pages/admin/scholarships/components/scholarshipModal';
import { useScholarshipDetail } from '~/pages/admin/scholarships/hooks';

// Chỉ mở form sau khi có bản đầy đủ: form lấy giá trị đầu một lần
export default function EditScholarshipModal({ scholarship, onClose, onSave, isSaving }) {
  const { data, error, refetch } = useScholarshipDetail(scholarship.slug || scholarship.id);

  if (data) return <ScholarshipModal scholarship={data} onClose={onClose} onSave={onSave} isSaving={isSaving} />;

  return (
    <ModalFrame title="Chỉnh sửa học bổng" onClose={onClose}>
      {error ? (
        <div className="p-6 text-center text-danger-400" role="alert">
          <p>Không tải được học bổng.</p>
          <button type="button" onClick={() => refetch()} className="btnSecondary mt-4">Thử lại</button>
        </div>
      ) : (
        <p className="p-6 text-center text-ink-400" role="status">Đang tải học bổng…</p>
      )}
    </ModalFrame>
  );
}
