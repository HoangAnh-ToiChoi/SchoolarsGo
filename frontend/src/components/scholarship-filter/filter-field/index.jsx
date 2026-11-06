import { cn } from '~/lib/utils';

const controlClass =
  'h-[38px] w-full rounded-control border bg-surface px-2.5 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-150 ' +
  'placeholder:text-fg-muted focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15';

// Một ô lọc: nhãn + select hoặc input. Ô đang có giá trị thì viền tím nhạt để dễ nhận ra.
export default function FilterField({ field, value, options = [], onChange }) {
  const id = `filter-${field.key}`;
  const active = value !== undefined && value !== '';
  const stateClass = active ? 'border-brand-200 bg-brand-50/40' : 'border-line';

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-fg-soft">
        {field.label}
      </label>
      {field.type === 'select' ? (
        <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, stateClass)}>
          <option value="">Tất cả</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.type}
          inputMode={field.type === 'number' ? 'decimal' : undefined}
          min={field.min}
          max={field.max}
          step={field.step}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(controlClass, stateClass)}
        />
      )}
    </div>
  );
}
