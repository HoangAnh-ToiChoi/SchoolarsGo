import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { cn } from '~/lib/utils';

// [1, …, 4, 5, 6, …, 12]: luôn có trang đầu, trang cuối và hai trang quanh trang hiện tại
function getPageItems(page, totalPages) {
  const pages = [...new Set([1, totalPages, page - 1, page, page + 1])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && pages[i - 1] !== p - 1 ? ['…', p] : [p]));
}

const itemClass =
  'flex h-9 min-w-9 items-center justify-center rounded-control px-2 text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-1">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Trang trước" className={cn(itemClass, 'text-fg-secondary hover:bg-hover')}>
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </button>
      {getPageItems(page, totalPages).map((item, i) =>
        item === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-fg-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(itemClass, item === page ? 'bg-brand-600 text-white' : 'text-fg-secondary hover:bg-hover')}
          >
            {item}
          </button>
        )
      )}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Trang sau" className={cn(itemClass, 'text-fg-secondary hover:bg-hover')}>
        <ChevronRightIcon className="size-5" aria-hidden="true" />
      </button>
    </nav>
  );
}
