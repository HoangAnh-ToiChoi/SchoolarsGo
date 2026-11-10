import { PlusIcon } from '@heroicons/react/16/solid';
import { ActiveFilters } from '~/components/scholarshipFilter';
import { Button } from '~/components/ui/button';
import { useScholarshipFilters } from '~/hooks/useScholarshipFilters';

const QUICK_DEGREES = [
  { value: 'Bachelor', label: 'Đại học' },
  { value: 'Master', label: 'Thạc sĩ' },
  { value: 'PhD', label: 'Tiến sĩ' },
];

// Hàng lọc của trang chủ: nhãn bộ lọc đang bật + nút lọc nhanh theo bậc học.
// Bộ lọc đầy đủ mở bằng cách bấm vào thanh tìm kiếm trên header.
export default function FilterBar() {
  const { filters, apply } = useScholarshipFilters();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActiveFilters />
      {/* Đã chọn bậc học thì nhãn ở ActiveFilters lo việc bỏ chọn, ẩn nút lọc nhanh */}
      {!filters.degree &&
        QUICK_DEGREES.map((d) => (
          <Button
            key={d.value}
            type="button"
            variant="outline"
            onClick={() => apply({ ...filters, degree: d.value })}
            className="h-filter border-dashed border-line-strong px-3 text-[13px] font-medium text-fg"
          >
            <PlusIcon className="text-fg-muted" aria-hidden="true" />
            {d.label}
          </Button>
        ))}
      <span className="ml-auto text-[13px] text-fg-muted">
        Sắp xếp: <strong className="font-semibold text-fg">Hạn nộp gần nhất</strong>
      </span>
    </div>
  );
}
