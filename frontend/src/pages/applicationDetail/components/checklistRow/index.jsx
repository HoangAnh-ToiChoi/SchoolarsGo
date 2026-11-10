import { useRef } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpTrayIcon, CheckCircleIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Button } from '~/components/ui/button';
import { cn } from '~/utils/cn';
import { safeUrl } from '~/utils/security';
import { ACCEPTED_FILES, formatFileSize, validateFile } from '~/pages/applicationDetail/helper';

// Một giấy tờ: tick đã xong | tên | tệp đính kèm hoặc nút tải lên — tất cả trên một dòng,
// thay cho khối tải lên riêng phải chọn loại tài liệu như trước.
// readOnly: đơn đã có kết quả hoặc đã rút — chỉ xem lại, không sửa.
export default function ChecklistRow({ item, document, uploading, readOnly, onToggle, onUpload, onDetach }) {
  const inputRef = useRef(null);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const error = validateFile(file);
    if (error) toast.error(error);
    else onUpload(file);
  };

  const fileUrl = safeUrl(document?.file_url);
  const mark = item.done ? (
    <CheckCircleIcon className="size-[22px] shrink-0 text-open-fg" aria-hidden="true" />
  ) : (
    <span
      aria-hidden="true"
      className="size-[22px] shrink-0 rounded-full border-2 border-line transition-colors duration-150 group-hover:border-brand-600"
    />
  );
  const name = (
    <span className={cn('min-w-0 break-words text-sm font-medium', item.done ? 'text-fg-muted' : 'text-fg')}>
      {item.item}
      {readOnly && <span className="sr-only">{item.done ? ' — đã xong' : ' — chưa xong'}</span>}
    </span>
  );

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
      {readOnly ? (
        <div className="flex min-w-[140px] flex-1 items-center gap-3">
          {mark}
          {name}
        </div>
      ) : (
        <button
          type="button"
          role="checkbox"
          aria-checked={item.done}
          onClick={onToggle}
          className="group flex min-w-[140px] flex-1 items-center gap-3 rounded-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {mark}
          {name}
        </button>
      )}

      {document ? (
        <div className="ml-[34px] flex min-w-0 max-w-[calc(100%-34px)] items-center gap-1 rounded-inner border border-line bg-canvas py-1 pl-2.5 pr-1 sm:ml-0 sm:max-w-[260px]">
          <DocumentTextIcon className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 truncate text-[13px] font-medium text-fg hover:text-brand-600 hover:underline"
            >
              {document.file_name}
            </a>
          ) : (
            <span className="min-w-0 truncate text-[13px] font-medium text-fg">{document.file_name}</span>
          )}
          {document.file_size > 0 && (
            <span className="shrink-0 text-[11.5px] text-fg-muted">{formatFileSize(document.file_size)}</span>
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={onDetach}
              aria-label={`Gỡ tệp ${document.file_name}`}
              className="ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-urgent-bg hover:text-urgent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <XMarkIcon className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        !readOnly && (
          <>
            <input ref={inputRef} type="file" accept={ACCEPTED_FILES} className="hidden" onChange={handleFile} tabIndex={-1} />
            <Button
              variant="subtle"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              aria-label={`Tải lên tệp cho ${item.item}`}
              className="gap-1.5"
            >
              <ArrowUpTrayIcon className="size-4" aria-hidden="true" />
              {uploading ? 'Đang tải…' : 'Tải tệp'}
            </Button>
          </>
        )
      )}
    </li>
  );
}
