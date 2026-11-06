import FilterField from '~/components/scholarship-filter/filter-field';
import FilterActions from '~/components/scholarship-filter/filter-actions';
import { FILTER_FIELDS } from '~/components/scholarship-filter/constants';
import { cn } from '~/lib/utils';

// Bảng 8 bộ lọc dưới thanh tìm kiếm. Mở: hiện mờ rồi rõ dần tại chỗ (không trượt). Đóng: display: none.
export default function FilterPanel({ id, isOpen, draft, countryOptions, onFieldChange, onReset }) {
  const activeCount = FILTER_FIELDS.filter((f) => draft[f.key]).length;

  return (
    <section
      id={id}
      aria-label="Bộ lọc học bổng"
      className={cn(
        'absolute left-1/2 top-[calc(100%+10px)] z-40 w-[min(760px,calc(100vw-48px))] -translate-x-1/2 rounded-tile border border-line bg-surface p-5 shadow-menu',
        isOpen ? 'block animate-in fade-in duration-200 motion-reduce:animate-none' : 'hidden'
      )}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {FILTER_FIELDS.map((field) => (
          <FilterField
            key={field.key}
            field={field}
            value={draft[field.key]}
            options={field.options === 'countries' ? countryOptions : field.options}
            onChange={(value) => onFieldChange(field.key, value)}
          />
        ))}
      </div>
      <FilterActions activeCount={activeCount} onReset={onReset} />
    </section>
  );
}
