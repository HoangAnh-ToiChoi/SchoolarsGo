import { cn } from '../../utils/helpers';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const sizes = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

const Button = ({ children, variant = 'primary', size = 'md', isLoading, className, disabled, ...props }) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(variants[variant], sizes[size], className)}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;
