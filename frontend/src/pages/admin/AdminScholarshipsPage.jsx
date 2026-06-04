import { useState } from 'react';
import { Plus, Pencil, Trash2, Star, StarOff, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  useAdminCreateScholarship, useAdminUpdateScholarship,
  useAdminToggleFeatured, useAdminDeleteScholarship,
} from '../../hooks/useAdmin';
import { useScholarships } from '../../hooks/useScholarship';
import { cn, formatDate } from '../../utils/helpers';

const EMPTY_FORM = {
  title: '', provider: '', country: '', degree: '', language: '',
  coverage: '', amount: '', deadline: '', description: '', requirements: '',
};

const DEGREES = ['Bachelor', 'Master', 'PhD', 'Any'];
const COVERAGES = ['Full', 'Partial'];

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="px-4 py-4"><div className="h-4 bg-ink-800 rounded w-3/4" /></td>
    ))}
  </tr>
);

const ScholarshipModal = ({ scholarship, onClose, onSave, isSaving }) => {
  const isEdit = !!scholarship?.id;
  const [form, setForm] = useState(
    isEdit
      ? {
          title: scholarship.title || '',
          provider: scholarship.provider || '',
          country: scholarship.country || '',
          degree: scholarship.degree || '',
          language: scholarship.language || '',
          coverage: scholarship.coverage || '',
          amount: scholarship.amount ?? '',
          deadline: scholarship.deadline ? scholarship.deadline.split('T')[0] : '',
          description: scholarship.description || '',
          requirements: scholarship.requirements || '',
        }
      : { ...EMPTY_FORM }
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.amount === '') delete payload.amount;
    else payload.amount = Number(payload.amount);
    if (!payload.deadline) delete payload.deadline;
    onSave(isEdit ? { id: scholarship.id, ...payload } : payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? 'Chỉnh sửa học bổng' : 'Thêm học bổng mới'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="input-label">Tên học bổng *</label>
              <input required value={form.title} onChange={(e) => set('title', e.target.value)} className="input" placeholder="Tên học bổng" />
            </div>
            <div>
              <label className="input-label">Tổ chức cấp *</label>
              <input required value={form.provider} onChange={(e) => set('provider', e.target.value)} className="input" placeholder="Tên tổ chức" />
            </div>
            <div>
              <label className="input-label">Quốc gia *</label>
              <input required value={form.country} onChange={(e) => set('country', e.target.value)} className="input" placeholder="UK, USA..." />
            </div>
            <div>
              <label className="input-label">Bậc học</label>
              <select value={form.degree} onChange={(e) => set('degree', e.target.value)} className="input">
                <option value="">Chọn bậc học</option>
                {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Ngôn ngữ</label>
              <input value={form.language} onChange={(e) => set('language', e.target.value)} className="input" placeholder="English, Korean..." />
            </div>
            <div>
              <label className="input-label">Hình thức</label>
              <select value={form.coverage} onChange={(e) => set('coverage', e.target.value)} className="input">
                <option value="">Chọn hình thức</option>
                {COVERAGES.map((c) => <option key={c} value={c}>{c === 'Full' ? 'Toàn phần' : 'Bán phần'}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Giá trị (USD)</label>
              <input type="number" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} className="input" placeholder="10000" />
            </div>
            <div>
              <label className="input-label">Hạn nộp</label>
              <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Mô tả</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="input resize-none"
                placeholder="Mô tả học bổng..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Yêu cầu</label>
              <textarea
                rows={3}
                value={form.requirements}
                onChange={(e) => set('requirements', e.target.value)}
                className="input resize-none"
                placeholder="GPA tối thiểu, IELTS..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm học bổng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminScholarshipsPage = () => {
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);

  const { data, isLoading, error } = useScholarships({ page, limit: 20 });
  const createScholarship = useAdminCreateScholarship();
  const updateScholarship = useAdminUpdateScholarship();
  const toggleFeatured = useAdminToggleFeatured();
  const deleteScholarship = useAdminDeleteScholarship();

  const scholarships = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  const isSaving = createScholarship.isPending || updateScholarship.isPending;

  const handleSave = (payload) => {
    const mutation = payload.id ? updateScholarship : createScholarship;
    mutation.mutate(payload, { onSuccess: () => setModal(null) });
  };

  const handleDelete = (s) => {
    if (!window.confirm(`Xóa học bổng "${s.title}"? Hành động này không thể hoàn tác.`)) return;
    deleteScholarship.mutate(s.id);
  };

  const handleToggleFeatured = (s) => {
    toggleFeatured.mutate({ id: s.id, isFeatured: !s.is_featured });
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-1 text-ink-100">Quản lý học bổng</h1>
          <p className="text-body-sm text-ink-400 mt-1">
            {meta.total > 0 ? `${meta.total} học bổng` : 'Danh sách học bổng'}
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Thêm học bổng
        </button>
      </div>

      <div className="card overflow-hidden">
        {error ? (
          <div className="p-12 text-center text-danger-400">Không thể tải dữ liệu.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800">
                  <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-ink-500">Học bổng</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-ink-500">Quốc gia</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-ink-500">Deadline</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-ink-500">Nổi bật</th>
                  <th className="px-4 py-3 text-right text-caption font-semibold uppercase tracking-wider text-ink-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                ) : scholarships.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-ink-500 italic">
                      Chưa có học bổng nào
                    </td>
                  </tr>
                ) : (
                  scholarships.map((s) => (
                    <tr key={s.id} className="hover:bg-ink-800/40 transition-colors">
                      <td className="px-4 py-4 max-w-xs">
                        <p className="font-semibold text-ink-100 truncate">{s.title}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{s.provider}</p>
                      </td>
                      <td className="px-4 py-4 text-ink-300">{s.country || '—'}</td>
                      <td className="px-4 py-4 text-ink-400 text-xs font-mono">
                        {s.deadline ? formatDate(s.deadline) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleFeatured(s)}
                          disabled={toggleFeatured.isPending}
                          title={s.is_featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                          className={cn(
                            'p-1.5 rounded-button transition-colors disabled:opacity-40',
                            s.is_featured
                              ? 'text-warning-400 hover:bg-warning-400/10'
                              : 'text-ink-600 hover:bg-ink-800'
                          )}
                        >
                          {s.is_featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal({ mode: 'edit', scholarship: s })}
                            className="p-1.5 rounded-button text-primary-400 hover:bg-primary-400/10 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            disabled={deleteScholarship.isPending}
                            className="p-1.5 rounded-button text-danger-500 hover:bg-danger-500/10 transition-colors disabled:opacity-40"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-ink-800">
            <p className="text-sm text-ink-500">
              Trang {meta.page} / {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-button border border-ink-800 text-ink-400 hover:bg-ink-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-button border border-ink-800 text-ink-400 hover:bg-ink-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <ScholarshipModal
          scholarship={modal.mode === 'edit' ? modal.scholarship : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default AdminScholarshipsPage;
