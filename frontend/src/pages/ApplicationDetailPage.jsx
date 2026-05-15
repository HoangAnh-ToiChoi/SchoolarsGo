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
import { AuroraBackground } from '../components/landing/AuroraBackground';

const STATUS_TRANSITIONS = {
  draft: [
    { value: 'submitted', label: 'Nộp đơn', color: 'blue' },
    { value: 'withdrawn', label: 'Rút đơn', color: 'red' },
  ],
  submitted: [{ value: 'withdrawn', label: 'Rút đơn', color: 'red' }],
  under_review: [{ value: 'withdrawn', label: 'Rút đơn', color: 'red' }],
  interview: [{ value: 'withdrawn', label: 'Rút đơn', color: 'red' }],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

const getStatusBadgeClass = (status) => {
  const map = {
    draft: 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70',
    submitted: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
    under_review: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
    interview: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400',
    accepted: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400',
    withdrawn: 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50',
  };
  return map[status] || 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70';
};

const getFileIcon = (fileName) => {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-500 flex-shrink-0" />;
  if (['doc', 'docx'].includes(ext)) return <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />;
  return <FileText className="w-5 h-5 text-gray-400 dark:text-white/40 flex-shrink-0" />;
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#050510] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (error || !data?.data) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white">
        <AuroraBackground />
        <div className="container-narrow relative z-10 py-32 text-center">
          <h2 className="text-3xl font-bold mb-4">Không tìm thấy đơn ứng tuyển</h2>
          <Link to="/applications" className="text-purple-500 hover:text-purple-600 font-medium">← Quay lại</Link>
        </div>
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
    uploadDoc.mutate({ file, type: docType });
  };

  const handleDeleteDoc = (docId) => {
    if (!window.confirm('Xóa tài liệu này?')) return;
    deleteDoc.mutate(docId);
  };

  return (
    <AnimatedPage className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white pb-24">
      <AuroraBackground />

      <div className="container-page relative z-10 pt-24 md:pt-32 mb-12">
        {/* Back + Title */}
        <div className="mb-10">
          <Link
            to="/applications"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đơn ứng tuyển
          </Link>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
                {scholarshipTitle}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {country && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/60 bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full">
                    <MapPin className="w-3.5 h-3.5" />{country}
                  </span>
                )}
                {app.applied_at && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/60 bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full">
                    <Calendar className="w-3.5 h-3.5" />Nộp: {formatDate(app.applied_at)}
                  </span>
                )}
              </div>
            </div>
            <span className={cn('px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0', getStatusBadgeClass(app.status))}>
              {getStatusLabel(app.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Checklist */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.03)]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Checklist hồ sơ</h2>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {doneCount}/{checklist.length} ({checklistPct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 mb-6 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                  style={{ width: `${checklistPct}%` }}
                />
              </div>
              {checklist.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-white/40 italic py-4">Chưa có checklist</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {checklist.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleToggleChecklist(i)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                    >
                      {item.done ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 dark:text-white/20 flex-shrink-0" />
                      )}
                      <span className={cn(
                        'text-sm font-medium transition-all',
                        item.done ? 'text-gray-400 dark:text-white/40 line-through' : 'text-gray-700 dark:text-white/90'
                      )}>
                        {item.item}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Document Upload */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.03)]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Tài liệu ứng tuyển</h2>

              <div className="mb-6 bg-gray-50 dark:bg-black/20 rounded-2xl p-5 border border-gray-100 dark:border-white/5">
                <label className="input-label block mb-2">Loại tài liệu</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="input w-full mb-4"
                >
                  {DOCUMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <FileUpload
                  accept=".pdf,.doc,.docx,.txt"
                  maxSize={5 * 1024 * 1024}
                  onFileSelect={handleUpload}
                  disabled={uploadDoc.isPending}
                />
              </div>

              {docsLoading ? (
                <div className="flex justify-center py-4"><LoadingSpinner /></div>
              ) : !documents?.data || documents.data.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-white/40 italic py-4">Chưa có tài liệu nào</p>
              ) : (
                <div className="space-y-2">
                  {documents.data.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                      {getFileIcon(doc.file_name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">{doc.file_name}</p>
                        <p className="text-xs text-gray-400 dark:text-white/40 font-mono mt-0.5">
                          {DOCUMENT_TYPES.find(t => t.value === doc.type)?.label || doc.type} • {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        disabled={deleteDoc.isPending}
                        className="text-rose-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex-shrink-0"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.03)]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Ghi chú cá nhân</h2>
              <textarea
                rows={4}
                value={currentNotes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors mb-4 resize-none"
                placeholder="Ghi chú về tiến độ, deadline nội bộ, tài liệu cần bổ sung..."
              />
              <button
                onClick={handleSaveNotes}
                disabled={updateApp.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:from-purple-500 hover:to-cyan-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {updateApp.isPending ? 'Đang lưu...' : 'Lưu ghi chú'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.05)]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Thông tin</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5">Trạng thái</p>
                  <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', getStatusBadgeClass(app.status))}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>
                {country && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5">Quốc gia</p>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-white/80">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-white/40" />{country}
                    </p>
                  </div>
                )}
                {deadline && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5">Deadline</p>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-white/80">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-white/40" />{formatDate(deadline)}
                    </p>
                  </div>
                )}
                {app.applied_at && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5">Ngày nộp</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-white/80">{formatDate(app.applied_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status transitions */}
            {transitions.length > 0 && (
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.05)]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cập nhật trạng thái</h3>
                <div className="space-y-3">
                  {transitions.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleStatusChange(t.value)}
                      disabled={updateApp.isPending}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50',
                        t.color === 'red'
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20'
                          : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20'
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
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-semibold text-sm transition-all"
              >
                Xem học bổng gốc
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {/* Delete */}
            {['draft', 'rejected', 'withdrawn'].includes(app.status) && (
              <button
                onClick={handleDelete}
                disabled={deleteApp.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-sm transition-all disabled:opacity-50"
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
