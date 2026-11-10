import FilterField from '~/components/scholarshipFilter/filterField';
import FilterActions from '~/components/scholarshipFilter/filterActions';
import { FILTER_FIELDS } from '~/components/scholarshipFilter/constants';
import { cn } from '~/utils/cn';

// Bảng 8 bộ lọc dưới thanh tìm kiếm. Mở: hiện mờ rồi rõ dần tại chỗ (không trượt). Đóng: display: none.
export default function FilterPanel({ id, isOpen, draft, countryOptions, onFieldChange, onReset }) {
  const activeCount = FILTER_FIELDS.filter((f) => draft[f.key]).length;

  return (
    // Lớp ngoài chỉ lo vị trí, lớp trong chỉ lo hiệu ứng mờ → rõ.
    // Tách 2 lớp vì hiệu ứng của tailwindcss-animate ghi đè transform, làm bảng trượt từ phải sang.
    // Màn hình nhỏ: ô tìm kiếm không nằm giữa màn hình nên bảng bám hai mép, ngay dưới header, tự cuộn nếu dài.
    // Từ lg: căn giữa theo ô tìm kiếm như thiết kế.
    <div
      className={cn(
        'fixed inset-x-3 top-[72px] z-40 max-h-[calc(100dvh-84px)] overflow-y-auto rounded-tile',
        'lg:absolute lg:inset-x-auto lg:left-1/2 lg:top-[calc(100%+10px)] lg:max-h-none lg:w-[min(760px,calc(100vw-48px))] lg:-translate-x-1/2 lg:overflow-visible',
        !isOpen && 'hidden'
      )}
    >
      <section
        id={id}
        aria-label="Bộ lọc học bổng"
        className="rounded-tile border border-line bg-surface p-5 shadow-menu animate-in fade-in duration-200 motion-reduce:animate-none"
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
    </div>
  );
}
