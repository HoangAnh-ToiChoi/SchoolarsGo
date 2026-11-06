import { PlusIcon } from '@heroicons/react/16/solid';
import { XMarkIcon } from '@heroicons/react/16/solid';
import { Button } from '~/components/ui/button';

const DEGREES = [
  { value: 'Bachelor', label: 'Đại học' },
  { value: 'Master', label: 'Thạc sĩ' },
  { value: 'PhD', label: 'Tiến sĩ' },
];

// Bộ lọc nhanh theo bậc học. Bộ lọc đầy đủ nằm ở trang Tìm học bổng.
export default function FilterBar({ degree, onDegreeChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {DEGREES.map((d) =>
        degree === d.value ? (
          <Button
            key={d.value}
            type="button"
            onClick={() => onDegreeChange(undefined)}
            className="h-filter rounded-control border border-brand-200 bg-brand-50 px-3 text-[13px] font-semibold text-brand-600 shadow-none hover:bg-brand-100"
            aria-pressed="true"
          >
            {d.label}
            <XMarkIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button
            key={d.value}
            type="button"
            variant="outline"
            onClick={() => onDegreeChange(d.value)}
            className="h-filter rounded-control border-dashed border-line-strong px-3 text-[13px] text-fg shadow-none hover:bg-hover"
            aria-pressed="false"
          >
            <PlusIcon className="text-fg-muted" aria-hidden="true" />
            {d.label}
          </Button>
        )
      )}
      <span className="ml-auto text-[13px] text-fg-muted">
        Sắp xếp: <strong className="font-semibold text-fg">Hạn nộp gần nhất</strong>
      </span>
    </div>
  );
}
