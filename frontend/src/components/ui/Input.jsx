import { cn } from '../../utils/helpers';

const Input = ({ label, icon: Icon, error, helperText, wrapperClassName, className, id, ...props }) => {
  const inputId = id || props.name;

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          id={inputId}
          className={cn(Icon ? 'input-with-icon' : 'input', error && 'border-danger-500 focus:ring-danger-500', className)}
          {...props}
        />
      </div>
      {error && <p className="text-caption text-danger-600 mt-1">{error}</p>}
      {!error && helperText && <p className="text-caption text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
};

export default Input;
