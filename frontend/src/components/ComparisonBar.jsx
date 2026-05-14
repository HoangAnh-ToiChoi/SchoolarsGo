import { Link } from 'react-router-dom';
import { X, GitCompare } from 'lucide-react';
import { useComparisonStore } from '../stores/comparisonStore';

const ComparisonBar = () => {
  const { items, remove, clear } = useComparisonStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white shadow-2xl border-t border-slate-700 animate-slide-up">
      <div className="container-page py-3 flex items-center gap-4">
        <GitCompare className="w-5 h-5 text-sky-300 shrink-0" />
        <div className="flex flex-1 items-center gap-3 overflow-x-auto">
          {items.map((s) => (
            <div key={s.id} className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-1.5 shrink-0">
              <span className="text-body-sm font-medium text-white max-w-[160px] truncate">{s.title}</span>
              <button onClick={() => remove(s.id)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {items.length < 3 && (
            <span className="text-body-sm text-slate-400 shrink-0">
              Chọn thêm {3 - items.length} học bổng nữa
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {items.length >= 2 && (
            <Link
              to={`/compare?ids=${items.map((s) => s.id).join(',')}`}
              className="bg-primary-600 hover:bg-primary-700 text-white text-body-sm font-semibold px-4 py-2 rounded-button transition-colors"
            >
              So sánh ({items.length})
            </Link>
          )}
          <button onClick={clear} className="text-slate-400 hover:text-white text-body-sm transition-colors">
            Xóa tất cả
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;
