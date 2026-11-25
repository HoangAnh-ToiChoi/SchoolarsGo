import { cn } from '~/utils/cn';
import {
  PROFILE_CONTROL_CLASS,
  PROFILE_ERROR_CONTROL_CLASS,
} from '~/pages/profile/constants';

function renderControl({ field, inputId, errorId, value, error, onChange, onBlur, currentYear }) {
  const commonProps = {
    id: inputId,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
    onBlur: (e) => onBlur?.(field.key, e.target.value),
  };

  if (field.type === 'select') {
    return (
      <select
        {...commonProps}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={cn(PROFILE_CONTROL_CLASS, error && PROFILE_ERROR_CONTROL_CLASS)}
      >
        <option value="">{field.placeholder}</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        {...commonProps}
        rows={field.rows || 4}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={cn(PROFILE_CONTROL_CLASS, 'h-auto resize-none py-2', error && PROFILE_ERROR_CONTROL_CLASS)}
      />
    );
  }

  const maxAttr = field.key === 'birth_year' ? currentYear : field.max;

  return (
    <>
      <input
        {...commonProps}
        type={field.type}
        step={field.step}
        min={field.min}
        max={maxAttr}
        placeholder={field.placeholder}
        list={field.datalist ? `list-${field.key}` : undefined}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={cn(PROFILE_CONTROL_CLASS, error && PROFILE_ERROR_CONTROL_CLASS)}
      />
      {field.datalist && (
        <datalist id={`list-${field.key}`}>
          {field.datalist.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      )}
    </>
  );
}

export default function ProfileFieldInput({ field, value, error, onChange, onBlur, currentYear }) {
  const inputId = `field-${field.key}`;
  const errorId = `error-${field.key}`;
  const displayValue = value ?? '';

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', field.colSpan === 2 && 'md:col-span-2')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <label htmlFor={inputId} className="text-xs font-semibold text-fg-soft">
          {field.label}
        </label>
        {field.hint && (
          <span className="text-label-sm text-fg-muted">{field.hint}</span>
        )}
      </div>

      {renderControl({
        field,
        inputId,
        errorId,
        value: displayValue,
        error,
        onChange,
        onBlur,
        currentYear,
      })}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-urgent-fg">
          {error}
        </p>
      )}
    </div>
  );
}
