import { Card } from '~/components/ui/card';
import ChecklistRow from '~/pages/applicationDetail/components/checklistRow';
import { ACCEPTED_FILES, MAX_FILE_MB } from '~/pages/applicationDetail/helper';

// Giấy tờ cần chuẩn bị: tiến độ ở đầu thẻ, mỗi giấy tờ một dòng kèm tệp của nó.
export default function ChecklistCard({ checklist, documentsById, uploadingIndex, readOnly, onToggle, onUpload, onDetach }) {
  const done = checklist.filter((item) => item.done).length;
  const percent = checklist.length ? Math.round((done / checklist.length) * 100) : 0;
  const formats = ACCEPTED_FILES.replaceAll('.', '').toUpperCase().split(',').join(', ');

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-block-title text-heading">Giấy tờ cần chuẩn bị</h2>
          <span className="text-[13px] font-semibold text-fg">
            {done}/{checklist.length} đã xong
          </span>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-track"
          role="progressbar"
          aria-label="Tiến độ chuẩn bị hồ sơ"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={
              percent === 100
                ? 'h-full rounded-full bg-open-fg transition-all duration-200'
                : 'h-full rounded-full bg-brand-600 transition-all duration-200'
            }
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {checklist.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-fg-muted">Học bổng này chưa có danh sách giấy tờ.</p>
      ) : (
        <ul className="divide-y divide-line">
          {checklist.map((item, i) => (
            <ChecklistRow
              key={`${item.item}-${i}`}
              item={item}
              document={item.document_id ? documentsById.get(item.document_id) : null}
              uploading={uploadingIndex === i}
              readOnly={readOnly}
              onToggle={() => onToggle(i)}
              onUpload={(file) => onUpload(i, file)}
              onDetach={() => onDetach(i)}
            />
          ))}
        </ul>
      )}
      {!readOnly && (
        <p className="border-t border-line bg-canvas px-4 py-2.5 text-[12px] text-fg-muted sm:px-5">
          Tệp {formats} · tối đa {MAX_FILE_MB}MB · tệp tải lên cũng được lưu vào hồ sơ của bạn
        </p>
      )}
    </Card>
  );
}
