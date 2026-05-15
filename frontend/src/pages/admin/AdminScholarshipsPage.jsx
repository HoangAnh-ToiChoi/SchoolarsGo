import { useState } from 'react';
import { Plus, Pencil, Trash2, Star, StarOff, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedItem from '../../components/ui/AnimatedItem';
import {
  useAdminCreateScholarship, useAdminUpdateScholarship,
  useAdminToggleFeatured, useAdminDeleteScholarship,
} from '../../hooks/useAdmin';
import { useScholarships } from '../../hooks/useScholarship';
import { cn, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';

const EMPTY_FORM = {
  title: '', provider: '', country: '', degree: '', language: '',
  coverage: '', amount: '', deadline: '', description: '', requirements: '',
};

const DEGREES = ['Bachelor', 'Master', 'PhD', 'Any'];
const COVERAGES = ['Full', 'Partial'];

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4" /></td>
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
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-white dark:bg-[#0d0d1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Chỉnh sửa học bổng' : 'Thêm học bổng mới'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-white/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="input-label">Tên học bổng *</label>
              <input required value={form.title} onChange={(e) => set('title', e.target.value)} className="input w-full" placeholder="Tên học bổng" />
            </div>
            <div>
              <label className="input-label">Tổ chức cấp *</label>
              <input required value={form.provider} onChange={(e) => set('provider', e.target.value)} className="input w-full" placeholder="Tên tổ chức" />
            </div>
            <div>
              <label className="input-label">Quốc gia *</label>
              <input required value={form.country} onChange={(e) => set('country', e.target.value)} className="input w-full" placeholder="UK, USA..." />
            </div>
            <div>
              <label className="input-label">Bậc học</label>
              <select value={form.degree} onChange={(e) => set('degree', e.target.value)} className="input w-full">
                <option value="">Chọn bậc học</option>
                {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Ngôn ngữ</label>
              <input value={form.language} onChange={(e) => set('language', e.target.value)} className="input w-full" placeholder="English, Korean..." />
            </div>
            <div>
              <label className="input-label">Hình thức</label>
              <select value={form.coverage} onChange={(e) => set('coverage', e.target.value)} className="input w-full">
                <option value="">Chọn hình thức</option>
                {COVERAGES.map((c) => <option key={c} value={c}>{c === 'Full' ? 'Toàn phần' : 'Bán phần'}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Giá trị (USD)</label>
              <input type="number" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} className="input w-full" placeholder="10000" />
            </div>
            <div>
              <label className="input-label">Hạn nộp</label>
              <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} className="input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Mô tả</label>
              <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none" placeholder="Mô tả học bổng..." />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Yêu cầu</label>
              <textarea rows={3} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none" placeholder="GPA tối thiểu, IELTS..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 font-medium text-sm transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm học bổng'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AdminScholarshipsPage = () => {
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', scholarship }

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
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Quản lý học bổng</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
            {meta.total > 0 ? `${meta.total} học bổng` : 'Danh sách học bổng'}
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Thêm học bổng
        </button>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        {error ? (
          <div className="p-12 text-center text-rose-500 dark:text-rose-400">Không thể tải dữ liệu.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Học bổng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Quốc gia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Deadline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Nổi bật</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                ) : scholarships.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-gray-400 dark:text-white/30 italic">
                      Chưa có học bổng nào
                    </td>
                  </tr>
                ) : (
                  scholarships.map((s) => (
                    <AnimatedItem key={s.id} as="tr" standalone className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 max-w-xs">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{s.title}</p>
                        <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">{s.provider}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-600 dark:text-white/70">{s.country || '—'}</td>
                      <td className="px-4 py-4 text-gray-500 dark:text-white/50 text-xs font-mono">
                        {s.deadline ? formatDate(s.deadline) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleFeatured(s)}
                          disabled={toggleFeatured.isPending}
                          title={s.is_featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors disabled:opacity-40',
                            s.is_featured
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                              : 'text-gray-400 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/5'
                          )}
                        >
                          {s.is_featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal({ mode: 'edit', scholarship: s })}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            disabled={deleteScholarship.isPending}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </AnimatedItem>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-white/40">
              Trang {meta.page} / {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <ScholarshipModal
            scholarship={modal.mode === 'edit' ? modal.scholarship : null}
            onClose={() => setModal(null)}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminScholarshipsPage;
