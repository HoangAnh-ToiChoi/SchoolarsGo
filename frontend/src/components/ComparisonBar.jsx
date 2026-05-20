import { Link } from 'react-router-dom';
import { X, GitCompare } from 'lucide-react';
import { useComparisonStore } from '../stores/comparisonStore';

const ComparisonBar = () => {
  const { items, remove, clear } = useComparisonStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-ink-950/95 backdrop-blur-md border-t border-ink-800 animate-slide-up">
      <div className="container-page py-3 flex items-center gap-4">
        <GitCompare className="w-5 h-5 text-primary-400 shrink-0" />
        <div className="flex flex-1 items-center gap-3 overflow-x-auto">
          {items.map((s) => (
            <div key={s.id} className="flex items-center gap-2 bg-ink-900 border border-ink-800 rounded-lg px-3 py-1.5 shrink-0">
              <span className="text-body-sm font-medium text-ink-200 max-w-[160px] truncate">{s.title}</span>
              <button onClick={() => remove(s.id)} className="text-ink-500 hover:text-ink-100 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {items.length < 3 && (
            <span className="text-body-sm text-ink-500 shrink-0">
              Chọn thêm {3 - items.length} học bổng nữa
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {items.length >= 2 && (
            <Link
              to={`/compare?ids=${items.map((s) => s.id).join(',')}`}
              className="btn-primary btn-sm"
            >
              So sánh ({items.length})
            </Link>
          )}
          <button onClick={clear} className="text-ink-500 hover:text-ink-200 text-body-sm transition-colors">
            Xóa tất cả
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;
