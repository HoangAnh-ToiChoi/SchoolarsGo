import { XMarkIcon } from '@heroicons/react/16/solid';
import { getFilterLabel } from '~/components/scholarship-filter/constants';
import { useScholarshipFilters } from '~/hooks/useScholarshipFilters';

// Hàng nhãn bộ lọc đang bật trên trang Tìm học bổng. Mỗi nhãn bỏ riêng được.
export default function ActiveFilters() {
  const { filters, removeFilter, clearAll } = useScholarshipFilters();
  const entries = Object.entries(filters);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Bộ lọc đang áp dụng">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex h-8 items-center gap-1.5 rounded-control border border-brand-200 bg-brand-50 pl-3 pr-1.5 text-[13px] font-semibold text-brand-700"
        >
          {getFilterLabel(key, value)}
          <button
            type="button"
            onClick={() => removeFilter(key)}
            aria-label={`Bỏ bộ lọc ${getFilterLabel(key, value)}`}
            className="flex size-5 items-center justify-center rounded-full transition-colors hover:bg-brand-100"
          >
            <XMarkIcon className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="h-8 px-1.5 text-[13px] font-semibold text-fg-muted underline underline-offset-[3px] transition-colors hover:text-fg"
      >
        Xóa tất cả
      </button>
    </div>
  );
}
