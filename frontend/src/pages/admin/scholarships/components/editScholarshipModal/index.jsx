import SlowLoading from '~/components/common/slowLoading';
import { Skeleton } from '~/components/ui/skeleton';
import { useSlowLoading } from '~/hooks/useSlowLoading';
import ModalFrame from '~/pages/admin/scholarships/components/modalFrame';
import ScholarshipModal from '~/pages/admin/scholarships/components/scholarshipModal';
import { MODAL_TITLES } from '~/pages/admin/scholarships/constants';
import { useScholarshipDetail } from '~/pages/admin/scholarships/hooks';
import { getLoadErrorText } from '~/pages/admin/scholarships/helpers';

// Chỉ mở form sau khi có bản đầy đủ: form lấy giá trị đầu một lần
export default function EditScholarshipModal({ scholarship, onClose, onSave, isSaving }) {
  const { data, error, isFetching, refetch } = useScholarshipDetail(scholarship.slug || scholarship.id);
  const isSlow = useSlowLoading(!data && isFetching);

  if (data) return <ScholarshipModal scholarship={data} onClose={onClose} onSave={onSave} isSaving={isSaving} />;

  return (
    <ModalFrame title={MODAL_TITLES.edit} onClose={onClose}>
      {error && !isFetching ? (
        <div className="p-6 text-center text-danger-400" role="alert">
          <p>{getLoadErrorText(error)}</p>
          <button type="button" onClick={() => refetch()} className="btnSecondary mt-4">Thử lại</button>
        </div>
      ) : (
        <div className="p-6 space-y-4" role="status" aria-label="Đang tải học bổng">
          {isSlow && <SlowLoading />}
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
    </ModalFrame>
  );
}
