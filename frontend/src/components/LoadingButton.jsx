import Button from './ui/Button';

const LoadingButton = ({ children, isLoading, variant = 'primary', ...props }) => {
  return (
    <Button variant={variant} isLoading={isLoading} {...props}>
      {children}
    </Button>
  );
};

export default LoadingButton;
