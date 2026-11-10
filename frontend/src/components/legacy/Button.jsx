import { cn } from '~/utils/cn';

const variants = {
  primary: 'btnPrimary',
  secondary: 'btnSecondary',
  ghost: 'btnGhost',
  danger: 'btnDanger',
};

const sizes = {
  sm: 'btnSm',
  md: '',
  lg: 'btnLg',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  loadingText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  className,
  disabled,
  type = 'button',
  ...props
}) => {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      className={cn(variants[variant], sizes[size], fullWidth && 'w-full', className)}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {!isLoading && LeftIcon && <LeftIcon className="w-4 h-4" />}
      {isLoading && loadingText ? loadingText : children}
      {!isLoading && RightIcon && <RightIcon className="w-4 h-4" />}
    </button>
  );
};

export default Button;
