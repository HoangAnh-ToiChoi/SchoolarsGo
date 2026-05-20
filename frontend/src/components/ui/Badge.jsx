import { cn } from '../../utils/helpers';

const colorMap = {
  gray:   'bg-ink-800 text-ink-300 border border-ink-700',
  blue:   'bg-primary-400/10 text-primary-300 border border-primary-400/20',
  green:  'bg-success-500/10 text-success-400 border border-success-500/20',
  yellow: 'bg-warning-500/10 text-warning-400 border border-warning-500/20',
  red:    'bg-danger-500/10 text-danger-400 border border-danger-500/20',
  purple: 'bg-primary-400/10 text-primary-300 border border-primary-400/20',
};

const Badge = ({ children, color = 'gray', className, ...props }) => {
  return (
    <span className={cn('badge', colorMap[color], className)} {...props}>
      {children}
    </span>
  );
};

export default Badge;
