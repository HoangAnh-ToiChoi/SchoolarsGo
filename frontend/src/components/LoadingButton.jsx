import { cn } from '../utils/helpers';

const LoadingButton = ({ children, isLoading, className, disabled, ...props }) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn('inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed', className)}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export default LoadingButton;
