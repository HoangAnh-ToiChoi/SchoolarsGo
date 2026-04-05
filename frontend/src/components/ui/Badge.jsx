import { cn } from '../../utils/helpers';

const colorMap = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-primary-50 text-primary-700',
  green: 'bg-success-50 text-success-700',
  yellow: 'bg-warning-50 text-warning-700',
  red: 'bg-danger-50 text-danger-700',
  purple: 'bg-secondary-50 text-secondary-700',
};

const Badge = ({ children, color = 'gray', className, ...props }) => {
  return (
    <span className={cn('badge', colorMap[color], className)} {...props}>
      {children}
    </span>
  );
};

export default Badge;
