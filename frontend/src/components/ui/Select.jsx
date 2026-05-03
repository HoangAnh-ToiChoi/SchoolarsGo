import { cn } from '../../utils/helpers';

const Select = ({ label, options, placeholder, className, id, onChange, ...props }) => {
  const selectId = id || props.name;

  const handleChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn('input', className)}
        onChange={handleChange}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
