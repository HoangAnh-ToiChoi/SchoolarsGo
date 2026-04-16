import { cn } from '../../utils/helpers';

const Card = ({ className, hover = false, children, ...props }) => {
  return (
    <div className={cn(hover ? 'card-hover' : 'card', className)} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('card-header', className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn('card-title', className)} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }) => (
  <p className={cn('card-description', className)} {...props}>
    {children}
  </p>
);

const CardContent = ({ className, children, ...props }) => (
  <div className={cn('card-body', className)} {...props}>
    {children}
  </div>
);

const CardFooter = ({ className, children, ...props }) => (
  <div className={cn('card-footer', className)} {...props}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };