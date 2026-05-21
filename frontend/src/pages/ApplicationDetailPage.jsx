import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, CheckCircle, Circle, Trash2, Save, ChevronRight, FileText } from 'lucide-react';
import { useApplication, useUpdateApplication, useDeleteApplication } from '../hooks/useApplication';
import { useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useProfile';
import AnimatedPage from '../components/ui/AnimatedPage';
import { DOCUMENT_TYPES } from '../utils/constants';
import { cn, formatDate, getStatusLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import FileUpload from '../components/ui/FileUpload';

const DOC_TYPE_CHECKLIST_MATCH = {
  cv: (item) => /^cv$/i.test(item.trim()),
  sop: (item) => /^sop$/i.test(item.trim()),
  transcript: (item) => /bảng\s*điểm|transcript/i.test(item),
  recommendation_letter: (item) => /thư\s*giới\s*thiệu|recommendation/i.test(item),
  other: (item) => /ielts|toefl|gre|gmat|hộ\s*chiếu|passport|chứng\s*chỉ/i.test(item),
};

const STATUS_TRANSITIONS = {
  draft:       [{ value: 'submitted', label: 'Nộp đơn', color: 'blue' }, { value: 'withdrawn', label: 'Rút đơn', color: 'red' }],
  submitted:   [{ value: 'withdrawn', label: 'Rút đơn', color: 'red' }],
  under_review:[{ value: 'withdrawn', label: 'Rút đơn', color: 'red' }],
  interview:   [{ value: 'withdrawn', label: 'Rút đơn', color: 'red' }],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

const STATUS_BADGE = {
  draft:       'bg-ink-800 text-ink-300',
  submitted:   'bg-blue-500/10 text-blue-400',
  under_review:'bg-warning-500/10 text-warning-400',
  interview:   'bg-primary-400/15 text-primary-400',
  accepted:    'bg-success-500/10 text-success-400',
  rejected:    'bg-danger-500/10 text-danger-400',
  withdrawn:   'bg-ink-800 text-ink-400',
};

const getFileIcon = (fileName) => {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (ext === 'pdf') return <FileText className="w-5 h-5 text-danger-500 flex-shrink-0" />;
  if (['doc', 'docx'].includes(ext)) return <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />;
  return <FileText className="w-5 h-5 text-ink-500 flex-shrink-0" />;
};

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useApplication(id);
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const [notes, setNotes] = useState(null);
  const [docType, setDocType] = useState('cv');

  if (isLoading) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (error || !data?.data) {
    return (
      <div className="min-h-screen bg-ink-950 py-16 text-center">
        <h2 className="text-2xl font-bold text-ink-100 mb-3">Không tìm thấy đơn ứng tuyển</h2>
        <Link to="/applications" className="text-primary-400 hover:text-primary-400 font-medium">← Quay lại</Link>
      </div>
    );
  }

  const app = data.data;
  const checklist = Array.isArray(app.checklist)
    ? app.checklist
    : (typeof app.checklist === 'string' ? JSON.parse(app.checklist || '[]') : []);
  const transitions = STATUS_TRANSITIONS[app.status] || [];
  const currentNotes = notes ?? app.notes ?? '';
  const doneCount = checklist.filter((i) => i.done).length;
  const checklistPct = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  const appDocIds = new Set(Array.isArray(app.documents_used) ? app.documents_used : []);
  const appDocuments = documents?.data?.filter(doc => appDocIds.has(doc.id)) ?? [];

  const scholarshipTitle = app.scholarship?.title || app.scholarship_title || 'Đơn ứng tuyển';
  const country = app.scholarship?.country || app.country;
  const deadline = app.scholarship?.deadline || app.deadline;
  const scholarshipId = app.scholarship?.id || app.scholarship_id;

  const handleToggleChecklist = (index) => {
    const updated = checklist.map((item, i) => i === index ? { ...item, done: !item.done } : item);
    updateApp.mutate({ id, checklist: updated });
  };

  const handleSaveNotes = () => {
    updateApp.mutate({ id, notes: currentNotes });
    setNotes(null);
  };

  const handleStatusChange = (newStatus) => {
    updateApp.mutate({ id, status: newStatus });
  };

  const handleDelete = () => {
    if (!window.confirm('Xóa đơn ứng tuyển này?')) return;
    deleteApp.mutate(id, { onSuccess: () => navigate('/applications') });
  };

  const handleUpload = (file, error) => {
    if (error || !file) return;
    uploadDoc.mutate({ file, type: docType }, {
      onSuccess: (result) => {
        const newDocId = result?.data?.data?.id;
        const currentDocIds = Array.isArray(app.documents_used) ? app.documents_used : [];
        const updatedDocIds = newDocId && !currentDocIds.includes(newDocId)
          ? [...currentDocIds, newDocId]
          : currentDocIds;
        const matchFn = DOC_TYPE_CHECKLIST_MATCH[docType];
        let checklistChanged = false;
        const updatedChecklist = matchFn
          ? checklist.map(item => {
              if (!item.done && matchFn(item.item)) { checklistChanged = true; return { ...item, done: true }; }
              return item;
            })
          : checklist;
        updateApp.mutate({ id, documents_used: updatedDocIds, ...(checklistChanged ? { checklist: updatedChecklist } : {}) });
      },
    });
  };

  const handleDeleteDoc = (docId) => {
    if (!window.confirm('Xóa tài liệu này?')) return;
    deleteDoc.mutate(docId, {
      onSuccess: () => {
        const updatedDocIds = (Array.isArray(app.documents_used) ? app.documents_used : []).filter(did => did !== docId);
        updateApp.mutate({ id, documents_used: updatedDocIds });
      },
    });
  };

  return (
    <AnimatedPage className="min-h-screen bg-ink-950 pb-16">
      <div className="container-page pt-8 mb-12">
        {/* Back + Title */}
        <div className="mb-8">
          <Link to="/applications" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-200 font-medium mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại đơn ứng tuyển
          </Link>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-ink-100 mb-3">{scholarshipTitle}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                {country && (
                  <span className="tag"><MapPin className="w-3.5 h-3.5" />{country}</span>
                )}
                {app.applied_at && (
                  <span className="tag"><Calendar className="w-3.5 h-3.5" />Nộp: {formatDate(app.applied_at)}</span>
                )}
              </div>
            </div>
            <span className={cn('px-3 py-1.5 rounded text-sm font-semibold flex-shrink-0', STATUS_BADGE[app.status] || STATUS_BADGE.draft)}>
              {getStatusLabel(app.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Checklist */}
            <div className="bg-ink-900 border border-ink-800 rounded-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink-100">Checklist hồ sơ</h2>
                <span className="text-sm font-semibold text-primary-400">{doneCount}/{checklist.length} ({checklistPct}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-800 mb-5 overflow-hidden">
                <div className="h-full rounded-full bg-primary-400 transition-all duration-500" style={{ width: `${checklistPct}%` }} />
              </div>
              {checklist.length === 0 ? (
                <p className="text-center text-ink-500 italic py-4">Chưa có checklist</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {checklist.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleToggleChecklist(i)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-ink-800 transition-colors text-left border border-transparent hover:border-ink-700"
                    >
                      {item.done
                        ? <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0" />
                        : <Circle className="w-5 h-5 text-ink-600 flex-shrink-0" />
                      }
                      <span className={cn('text-sm font-medium', item.done ? 'text-ink-500 line-through' : 'text-ink-200')}>
                        {item.item}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Document Upload */}
            <div className="bg-ink-900 border border-ink-800 rounded-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-ink-100 mb-5">Tài liệu ứng tuyển</h2>
              <div className="mb-5 bg-ink-950 rounded-lg p-4 border border-ink-800">
                <label className="input-label block mb-2">Loại tài liệu</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input w-full mb-4">
                  {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <FileUpload accept=".pdf,.doc,.docx,.txt" maxSize={5 * 1024 * 1024} onFileSelect={handleUpload} disabled={uploadDoc.isPending} />
              </div>
              {docsLoading ? (
                <div className="flex justify-center py-4"><LoadingSpinner /></div>
              ) : appDocuments.length === 0 ? (
                <p className="text-center text-ink-500 italic py-4">Chưa có tài liệu nào</p>
              ) : (
                <div className="space-y-2">
                  {appDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-ink-950 rounded-lg border border-ink-800 hover:bg-ink-800 transition-colors">
                      {getFileIcon(doc.file_name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-100 truncate">{doc.file_name}</p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          {DOCUMENT_TYPES.find(t => t.value === doc.type)?.label || doc.type} · {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteDoc(doc.id)} disabled={deleteDoc.isPending} className="text-ink-500 hover:text-danger-400 p-1.5 rounded transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-ink-900 border border-ink-800 rounded-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-ink-100 mb-4">Ghi chú cá nhân</h2>
              <textarea
                rows={4}
                value={currentNotes}
                onChange={(e) => setNotes(e.target.value)}
                className="input resize-none mb-4"
                placeholder="Ghi chú về tiến độ, deadline nội bộ, tài liệu cần bổ sung..."
              />
              <button
                onClick={handleSaveNotes}
                disabled={updateApp.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-primary-400 text-ink-950 font-semibold hover:bg-primary-300 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateApp.isPending ? 'Đang lưu...' : 'Lưu ghi chú'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Info */}
            <div className="bg-ink-900 border border-ink-800 rounded-card p-6">
              <h3 className="font-semibold text-ink-100 mb-4">Thông tin</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Trạng thái</p>
                  <span className={cn('px-2.5 py-1 rounded text-sm font-semibold', STATUS_BADGE[app.status] || STATUS_BADGE.draft)}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>
                {country && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Quốc gia</p>
                    <p className="flex items-center gap-1.5 text-sm text-ink-200"><MapPin className="w-4 h-4 text-ink-500" />{country}</p>
                  </div>
                )}
                {deadline && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Deadline</p>
                    <p className="flex items-center gap-1.5 text-sm text-ink-200"><Calendar className="w-4 h-4 text-ink-500" />{formatDate(deadline)}</p>
                  </div>
                )}
                {app.applied_at && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Ngày nộp</p>
                    <p className="text-sm text-ink-200">{formatDate(app.applied_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status transitions */}
            {transitions.length > 0 && (
              <div className="bg-ink-900 border border-ink-800 rounded-card p-6">
                <h3 className="font-semibold text-ink-100 mb-4">Cập nhật trạng thái</h3>
                <div className="space-y-2">
                  {transitions.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleStatusChange(t.value)}
                      disabled={updateApp.isPending}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 rounded-button font-semibold text-sm transition-colors disabled:opacity-50',
                        t.color === 'red'
                          ? 'bg-danger-500/10 text-danger-400 hover:bg-danger-500/10 border border-danger-500/30'
                          : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/10 border border-blue-500/30'
                      )}
                    >
                      {t.label}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View scholarship */}
            {scholarshipId && (
              <Link
                to={`/scholarships/${scholarshipId}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-button bg-ink-800 hover:bg-ink-800 border border-ink-700 text-ink-200 font-semibold text-sm transition-colors"
              >
                Xem học bổng gốc <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {/* Delete */}
            {['draft', 'rejected', 'withdrawn'].includes(app.status) && (
              <button
                onClick={handleDelete}
                disabled={deleteApp.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-button bg-danger-500/10 hover:bg-danger-500/10 border border-danger-500/30 text-danger-400 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Xóa đơn ứng tuyển
              </button>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ApplicationDetailPage;
