import { ChevronLeft, ChevronRight } from 'lucide-react';

const navButtonClass =
  'p-1.5 rounded-button border border-ink-800 text-ink-400 hover:bg-ink-800 disabled:opacity-40 transition-colors';

// Chân bảng quản trị: "Trang x / y" + nút trước / sau. setPage là setter của useState (nhận hàm cập nhật)
export default function AdminPagination({ meta, setPage }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-ink-800">
      <p className="text-sm text-ink-500">
        Trang {meta.page} / {meta.totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={meta.page <= 1}
          className={navButtonClass}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
          disabled={meta.page >= meta.totalPages}
          className={navButtonClass}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
