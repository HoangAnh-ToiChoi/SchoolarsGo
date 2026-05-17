import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, CheckSquare, Square, Trash2, Save, ChevronRight } from 'lucide-react';
import { useApplication, useUpdateApplication, useDeleteApplication } from '../hooks/useApplication';
import { cn, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Badge, PageHeader } from '../components/ui';

const STATUS_TRANSITIONS = {
  draft: [{ value: 'submitted', label: 'Nộp đơn', variant: 'primary' }, { value: 'withdrawn', label: 'Rút đơn', variant: 'danger' }],
  submitted: [{ value: 'withdrawn', label: 'Rút đơn', variant: 'danger' }],
  under_review: [{ value: 'withdrawn', label: 'Rút đơn', variant: 'danger' }],
  interview: [{ value: 'withdrawn', label: 'Rút đơn', variant: 'danger' }],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useApplication(id);
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();
  const [notes, setNotes] = useState(null);

  if (isLoading) return <LoadingSpinner />;

  if (error || !data?.data) {
    return (
      <div className="container-narrow py-16 text-center">
        <h2 className="text-heading-2 text-gray-900 mb-4">Không tìm thấy đơn ứng tuyển</h2>
        <Link to="/applications" className="text-primary-600 hover:text-primary-700 font-medium">← Quay lại</Link>
      </div>
    );
  }

  const app = data.data;
  const checklist = Array.isArray(app.checklist) ? app.checklist : (typeof app.checklist === 'string' ? JSON.parse(app.checklist || '[]') : []);
  const transitions = STATUS_TRANSITIONS[app.status] || [];
  const currentNotes = notes ?? app.notes ?? '';

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

  const doneCount = checklist.filter((i) => i.done).length;
  const checklistPct = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  return (
    <div className="container-narrow py-8">
      <Link to="/applications" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 font-medium mb-6">
        <ArrowLeft className="w-4 h-4" />Quay lại đơn ứng tuyển
      </Link>

      <PageHeader
        title={app.scholarship_title || 'Đơn ứng tuyển'}
        description={[app.country, app.applied_at && `Nộp: ${formatDate(app.applied_at)}`].filter(Boolean).join(' • ')}
        actions={
          <span className={cn('badge text-sm px-3 py-1.5', getStatusColor(app.status))}>
            {getStatusLabel(app.status)}
          </span>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main */}
        <div className="md:col-span-2 space-y-6">
          {/* Checklist */}
          <div className="card card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-3 text-gray-900">Checklist hồ sơ</h2>
              <span className="text-body-sm font-semibold text-primary-600">{doneCount}/{checklist.length} ({checklistPct}%)</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 mb-5 overflow-hidden">
              <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${checklistPct}%` }} />
            </div>
            <ul className="space-y-2">
              {checklist.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleToggleChecklist(i)}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors', item.done ? 'bg-success-50' : 'bg-gray-50 hover:bg-gray-100')}
                  >
                    {item.done ? <CheckSquare className="w-5 h-5 text-success-500 shrink-0" /> : <Square className="w-5 h-5 text-gray-400 shrink-0" />}
                    <span className={cn('text-body', item.done && 'line-through text-gray-400')}>{item.item}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          <div className="card card-body">
            <h2 className="text-heading-3 text-gray-900 mb-4">Ghi chú cá nhân</h2>
            <textarea
              rows={4}
              value={currentNotes}
              onChange={(e) => setNotes(e.target.value)}
              className="input mb-3"
              placeholder="Ghi chú về tiến độ, deadline nội bộ, tài liệu cần bổ sung..."
            />
            <Button onClick={handleSaveNotes} isLoading={updateApp.isPending} leftIcon={Save} size="sm">
              Lưu ghi chú
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info */}
          <div className="card card-body">
            <h3 className="text-heading-3 text-gray-900 mb-4">Thông tin</h3>
            <dl className="space-y-3 text-body-sm">
              <div><dt className="text-gray-500 mb-0.5">Trạng thái</dt><dd><span className={cn('badge', getStatusColor(app.status))}>{getStatusLabel(app.status)}</span></dd></div>
              {app.country && <div><dt className="text-gray-500 mb-0.5">Quốc gia</dt><dd className="flex items-center gap-1 font-medium"><MapPin className="w-4 h-4 text-gray-400" />{app.country}</dd></div>}
              {app.deadline && <div><dt className="text-gray-500 mb-0.5">Deadline</dt><dd className="flex items-center gap-1 font-medium"><Calendar className="w-4 h-4 text-gray-400" />{formatDate(app.deadline)}</dd></div>}
              {app.applied_at && <div><dt className="text-gray-500 mb-0.5">Ngày nộp</dt><dd className="font-medium">{formatDate(app.applied_at)}</dd></div>}
            </dl>
          </div>

          {/* Actions */}
          {transitions.length > 0 && (
            <div className="card card-body">
              <h3 className="text-heading-3 text-gray-900 mb-4">Cập nhật trạng thái</h3>
              <div className="space-y-2">
                {transitions.map((t) => (
                  <Button
                    key={t.value}
                    variant={t.variant === 'danger' ? 'danger' : 'primary'}
                    className="w-full justify-between"
                    isLoading={updateApp.isPending}
                    onClick={() => handleStatusChange(t.value)}
                  >
                    {t.label}<ChevronRight className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Link to scholarship */}
          {app.scholarship_id && (
            <Link to={`/scholarships/${app.scholarship_id}`} className="btn-secondary w-full justify-center">
              Xem học bổng gốc
            </Link>
          )}

          {/* Delete */}
          {['draft', 'rejected', 'withdrawn'].includes(app.status) && (
            <button onClick={handleDelete} className="btn-danger w-full">
              <Trash2 className="w-4 h-4" />Xóa đơn
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;
