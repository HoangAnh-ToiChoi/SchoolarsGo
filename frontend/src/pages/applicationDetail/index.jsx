import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import SlowLoading from '~/components/common/slowLoading';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { useApplication, useDeleteApplication, useUpdateApplication } from '~/hooks/useApplication';
import { useDocuments, useUploadDocument } from '~/hooks/useProfile';
import { useSlowLoading } from '~/hooks/useSlowLoading';
import { STATUS_META } from '~/utils/application';
import ChecklistCard from '~/pages/applicationDetail/components/checklistCard';
import DetailHeader from '~/pages/applicationDetail/components/detailHeader';
import DetailSkeleton from '~/pages/applicationDetail/components/detailSkeleton';
import NotesCard from '~/pages/applicationDetail/components/notesCard';
import StatusStepper from '~/pages/applicationDetail/components/statusStepper';
import { guessDocType, parseChecklist } from '~/pages/applicationDetail/helper';

// Trạng thái không quay lại được nên hỏi lại trước khi đổi
const FINAL_STATUSES = ['withdrawn', 'rejected', 'accepted'];

// Chi tiết đơn ứng tuyển. Bố cục gọn trong một màn hình:
// đầu trang (tên, trạng thái, hạn, việc tiếp theo) → thanh tiến trình → giấy tờ | ghi chú.
export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useApplication(id);
  const { data: documents } = useDocuments();
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();
  const uploadDoc = useUploadDocument();
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const isSlow = useSlowLoading(isLoading);

  const documentsById = useMemo(() => new Map((documents?.data ?? []).map((doc) => [doc.id, doc])), [documents]);

  if (isLoading) {
    return (
      <section className="flex min-w-0 flex-col gap-5">
        {isSlow && <SlowLoading />}
        <DetailSkeleton />
      </section>
    );
  }

  const app = data?.data;
  if (isError || !app?.scholarship) {
    return (
      <Card className="mx-auto mt-8 max-w-md p-8 text-center">
        <p className="font-semibold text-fg">Không tải được đơn ứng tuyển</p>
        <p className="mt-1 text-sm text-fg-muted">Đơn có thể đã bị xóa hoặc mạng đang chập chờn.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/applications">Về danh sách đơn</Link>
          </Button>
          <Button onClick={() => refetch()}>Thử lại</Button>
        </div>
      </Card>
    );
  }

  const checklist = parseChecklist(app.checklist);
  const documentsUsed = Array.isArray(app.documents_used) ? app.documents_used : [];

  const saveChecklist = (nextChecklist, extra = {}) => updateApp.mutate({ id, checklist: nextChecklist, ...extra });
  const replaceItem = (index, patch) => checklist.map((item, i) => (i === index ? { ...item, ...patch } : item));

  const handleToggle = (index) => saveChecklist(replaceItem(index, { done: !checklist[index].done }));

  // Tải tệp lên hồ sơ rồi gắn vào đúng dòng giấy tờ; có tệp nghĩa là mục đó đã xong
  const handleUpload = (index, file) => {
    setUploadingIndex(index);
    uploadDoc.mutate(
      { file, type: guessDocType(checklist[index].item) },
      {
        onSuccess: (res) => {
          const docId = res?.data?.data?.id;
          if (!docId) return;
          saveChecklist(replaceItem(index, { done: true, document_id: docId }), {
            documents_used: [...new Set([...documentsUsed, docId])],
          });
        },
        onSettled: () => setUploadingIndex(null),
      },
    );
  };

  // Chỉ gỡ khỏi đơn, tệp vẫn nằm trong hồ sơ để dùng cho đơn khác
  const handleDetach = (index) => {
    const docId = checklist[index].document_id;
    saveChecklist(replaceItem(index, { done: false, document_id: null }), {
      documents_used: documentsUsed.filter((used) => used !== docId),
    });
  };

  const handleStatusChange = (status) => {
    const label = STATUS_META[status]?.label ?? status;
    if (FINAL_STATUSES.includes(status) && !window.confirm(`Chuyển đơn sang "${label}"? Không thể hoàn tác.`)) return;
    updateApp.mutate({ id, status }, { onSuccess: () => toast.success(`Đã cập nhật: ${label}`) });
  };

  const handleDelete = () => {
    if (!window.confirm('Xóa đơn ứng tuyển này?')) return;
    deleteApp.mutate(id, { onSuccess: () => navigate('/applications') });
  };

  return (
    <section className="flex min-w-0 flex-col gap-5">
      <DetailHeader
        application={app}
        busy={updateApp.isPending || deleteApp.isPending}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
      <StatusStepper status={app.status} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ChecklistCard
          checklist={checklist}
          documentsById={documentsById}
          uploadingIndex={uploadingIndex}
          readOnly={FINAL_STATUSES.includes(app.status)}
          onToggle={handleToggle}
          onUpload={handleUpload}
          onDetach={handleDetach}
        />
        <div className="lg:sticky lg:top-[88px]">
          <NotesCard
            key={app.id}
            notes={app.notes}
            saving={updateApp.isPending && updateApp.variables?.notes !== undefined}
            onSave={(notes, options) => updateApp.mutate({ id, notes }, options)}
          />
        </div>
      </div>
    </section>
  );
}
