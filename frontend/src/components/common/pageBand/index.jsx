import { forwardRef } from 'react';
import { cn } from '~/utils/cn';

/**
 * Dải đầu trang tự bù padding của layout cha (UserLayout: p-4 sm:p-6 lg:p-8).
 * Tự động áp dụng lề âm để tràn hết bề ngang và chạm đỉnh layout, đồng thời
 * bù đắp padding ngang tương ứng để nội dung bên trong thẳng hàng với trang.
 */
const PageBand = forwardRef(function PageBand(
  { as: Component = 'div', className, children, ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={cn(
        '-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 px-4 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

export { PageBand };
export default PageBand;
