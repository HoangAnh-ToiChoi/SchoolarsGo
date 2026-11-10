import { forwardRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/16/solid';
import { cn } from '~/utils/cn';

// Ô nhập từ khóa trên header. Bấm vào ô (onFocus) thì mở bảng bộ lọc.
const SearchInput = forwardRef(({ value, onChange, onFocus, isOpen, controlsId }, ref) => (
  <label
    className={cn(
      'flex h-control items-center gap-2.5 rounded-full border bg-surface pl-4 pr-1.5 text-fg-muted shadow-search transition-[border-color,box-shadow] duration-200',
      isOpen ? 'border-brand-600 ring-[3px] ring-brand-600/15' : 'border-line hover:border-line-strong'
    )}
  >
    <MagnifyingGlassIcon className="size-4 shrink-0" aria-hidden="true" />
    <span className="sr-only">Tìm học bổng</span>
    <input
      ref={ref}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onClick={onFocus}
      // Esc chỉ đóng bảng bộ lọc; chặn hành vi mặc định của ô search là xóa sạch chữ
      onKeyDown={(e) => e.key === 'Escape' && e.preventDefault()}
      placeholder="Tìm học bổng, trường, quốc gia…"
      aria-expanded={isOpen}
      aria-controls={controlsId}
      autoComplete="off"
      className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Xóa từ khóa"
        className="flex size-7 items-center justify-center rounded-full bg-hover text-fg-muted transition-colors hover:bg-track hover:text-fg"
      >
        <XMarkIcon className="size-3.5" aria-hidden="true" />
      </button>
    )}
  </label>
));
SearchInput.displayName = 'SearchInput';

export default SearchInput;
