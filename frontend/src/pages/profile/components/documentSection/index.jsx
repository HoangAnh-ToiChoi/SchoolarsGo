import { useRef, useState } from 'react';
import { useDocuments, useUploadDocument, useDeleteDocument } from '~/hooks/useProfile';
import { DOCUMENT_TYPES } from '~/utils/constants';
import { autoClassifyDocument, validateDocumentFile } from '../../helper';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { FileText, Trash2, Eye, Download, UploadCloud, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '~/utils/cn';

export default function DocumentSection() {
  const { data: documents, isLoading, isError, refetch } = useDocuments();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = (file) => {
    if (!file) return;
    const { valid, error } = validateDocumentFile(file);
    if (!valid) {
      toast.error(error);
      return;
    }
    const type = autoClassifyDocument(file);
    uploadDoc.mutate({ file, type });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleView = (doc) => {
    const url = doc.url || doc.file_url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (doc) => {
    const url = doc.url || doc.file_url;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.file_name || 'document';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const docList = documents?.data || [];

  return (
    <section className="space-y-6 rounded-tile border border-line bg-surface p-6 shadow-tile sm:p-8">
      <h2 className="border-b border-line pb-3 text-lg font-semibold text-heading">
        Tài liệu của tôi
      </h2>

      {/* Vùng tải tệp Drag & Drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-inner border-2 border-dashed p-6 text-center transition-colors',
          isDragging ? 'border-brand-600 bg-brand-50/50' : 'border-line bg-canvas hover:border-brand-200 hover:bg-brand-50/20'
        )}
      >
        <UploadCloud className="size-8 text-brand-600" aria-hidden="true" />
        <p className="mt-2 text-sm font-semibold text-fg">
          {uploadDoc.isPending ? 'Đang tải tệp lên…' : 'Kéo thả file hoặc bấm để chọn'}
        </p>
        <p className="mt-1 text-xs text-fg-muted">Hỗ trợ .pdf, .doc, .docx, .txt (tối đa 10MB)</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          disabled={uploadDoc.isPending}
          className="sr-only"
          aria-label="Tải lên tài liệu mới"
        />
      </div>

      {/* 4 Trạng thái: Loading, Error, Empty, Data */}
      {isLoading ? (
        <div className="space-y-3 pt-2">
          <Skeleton className="h-14 w-full rounded-inner" />
          <Skeleton className="h-14 w-full rounded-inner" />
        </div>
      ) : isError ? (
        <Card className="flex flex-col items-center p-6 text-center">
          <AlertCircle className="size-8 text-urgent-fg" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-heading">Không tải được danh sách tài liệu.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">Thử lại</Button>
        </Card>
      ) : docList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-inner border border-dashed border-line p-8 text-center">
          <FileText className="size-8 text-fg-muted" aria-hidden="true" />
          <p className="mt-2 font-medium text-heading">Chưa tải lên tài liệu nào</p>
          <p className="mt-1 text-xs text-fg-muted">Tải lên CV, SOP, bảng điểm để chuẩn bị hồ sơ ứng tuyển của bạn.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DOCUMENT_TYPES.map((docType) => {
            const docs = docList.filter((d) => d.type === docType.value);
            return (
              <div key={docType.value} className="rounded-inner border border-line p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-heading">{docType.label}</h3>
                  <span className="text-xs text-fg-muted">{docs.length} tệp</span>
                </div>
                {docs.length > 0 ? (
                  <ul className="space-y-2">
                    {docs.map((doc) => (
                      <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-canvas p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <FileText className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-fg">{doc.file_name}</p>
                            <p className="text-xs text-fg-muted">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleView(doc)}
                            aria-label={`Xem tài liệu ${doc.file_name}`}
                            className="rounded-control p-1.5 text-fg-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            aria-label={`Tải xuống tài liệu ${doc.file_name}`}
                            className="rounded-control p-1.5 text-fg-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                          >
                            <Download className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDoc.mutate(doc.id)}
                            disabled={deleteDoc.isPending}
                            aria-label={`Xóa tài liệu ${doc.file_name}`}
                            className="rounded-control p-1.5 text-fg-muted transition-colors hover:bg-urgent-bg hover:text-urgent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-fg/40 disabled:opacity-50"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-fg-muted">Chưa có tài liệu nào trong mục này</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
